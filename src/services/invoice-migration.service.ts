import Stripe from 'stripe';
import { migrationMappings } from '../mappings';
import { MigrationResultsRecorder } from '../util/migration-results-recorder.util';
import { config } from '../config/config';

/**
 * Transforms an invoice to a create invoice request object
 * @param sourceInvoice - The source invoice to transform
 * @returns The transformed invoice create request object
 */
function transformInvoiceToCreateInvoiceRequestObject(sourceInvoice: Stripe.Invoice): Stripe.InvoiceCreateParams {

    const destinationCustomerId = migrationMappings.customerMappings[sourceInvoice.customer as string];
    const destinationSubscriptionId = migrationMappings.subscriptionMappings[sourceInvoice.subscription as string];

    if (!destinationCustomerId) {
        throw new Error(`Customer not found for invoice ${sourceInvoice.id}`);
    }

    if (!destinationSubscriptionId) {
        throw new Error(`Subscription not found for invoice ${sourceInvoice.id}`);
    }

    const destinationInvoiceNumber: string = (config.mode === 'test' ? undefined : sourceInvoice.number) || Date.now().toString();

    return {
        customer: destinationCustomerId,
        auto_advance: false,
        collection_method: 'send_invoice',
        number: destinationInvoiceNumber,
        days_until_due: 30,
        subscription: destinationSubscriptionId,
        custom_fields: sourceInvoice.custom_fields || undefined,
        effective_at: sourceInvoice.effective_at || sourceInvoice.created,
        description: sourceInvoice.description || undefined,
        footer: sourceInvoice.footer || undefined,
        metadata: {
            ...sourceInvoice.metadata,
            is_migrated_invoice: "true",
            migration_date: new Date().toISOString(),
            original_invoice_id: sourceInvoice.id,
            original_invoice_number: sourceInvoice.number || '',
            original_invoice_date: new Date(sourceInvoice.created * 1000).toISOString(),
            original_invoice_due_date: sourceInvoice.due_date ? new Date(sourceInvoice.due_date * 1000).toISOString() : 'not applicable',
            original_collection_method: sourceInvoice.collection_method,
            original_customer_id: sourceInvoice.customer as string,
            original_customer_name: sourceInvoice.customer_name || '',
            original_stripe_account: sourceInvoice.account_name as string,
        },
    };
}

async function transformInvoiceLineItems(sourceInvoice: Stripe.Invoice): Promise<Stripe.InvoiceAddLinesParams> {

    // TODO:
    // 1. Figure out discounts
    // 2. Confirm tax rates are migrated correctly
    const transformedLineItems: Stripe.InvoiceAddLinesParams.Line[] = sourceInvoice.lines.data.map((line) => ({
        description: line.description || '',
        price: migrationMappings.priceMappings[line.price?.id as string],
        period: {
            start: line.period?.start,
            end: line.period?.end
        },
    }));

    return {
        lines: transformedLineItems
    }
}

async function creditCustomerAccountForInvoice(distinationStripe: Stripe, invoice: Stripe.Invoice): Promise<void> {
    await distinationStripe.customers.createBalanceTransaction(
        invoice.customer as string,
        {
            amount: invoice.total * -1,
            currency: invoice.currency,
            description: `Credit for migrated invoice ${invoice.id}`,
        }
    );
}

async function payInvoice(distinationStripe: Stripe, invoice: Stripe.Invoice): Promise<Stripe.Invoice> {
    await creditCustomerAccountForInvoice(distinationStripe, invoice);
    return await distinationStripe.invoices.pay(invoice.id, {
        paid_out_of_band: true
    });
}

export class InvoiceMigrationService {

    private sourceStripe: Stripe;
    private destinationStripe: Stripe;
    private migrationResultsRecorder: MigrationResultsRecorder;

    constructor(sourceStripeApiKey: string, destinationStripeApiKey: string) {
        this.sourceStripe = new Stripe(sourceStripeApiKey, { maxNetworkRetries: 3 });
        this.destinationStripe = new Stripe(destinationStripeApiKey, { maxNetworkRetries: 3 });
        this.migrationResultsRecorder = MigrationResultsRecorder.getInstance();
    }

    async migrateInvoice(originalInvoice: Stripe.Invoice): Promise<Stripe.Invoice | null> {

        try {
            let transformedInvoice = transformInvoiceToCreateInvoiceRequestObject(originalInvoice);
            let transformedLineItems = await transformInvoiceLineItems(originalInvoice);

            // Create the new invoice and add line items in the destination account
            let draftMigratedInvoice = await this.destinationStripe.invoices.create(transformedInvoice);
            draftMigratedInvoice = await this.destinationStripe.invoices.addLines(draftMigratedInvoice.id, transformedLineItems);

            // Pay the invoice in the destination account
            // let paidInvoice = await payInvoice(this.destinationStripe, draftMigratedInvoice);
            let paidInvoice = draftMigratedInvoice;

            // Record the migration result
            this.migrationResultsRecorder.recordMigrationResult(originalInvoice, paidInvoice);

            return paidInvoice;
        } catch (error) {
            console.error(`Error migrating invoice ${originalInvoice.id}: ${error}`);

            this.migrationResultsRecorder.recordFailedMigrationResult(originalInvoice, error as Error);

            return null;
        }
    }
}
