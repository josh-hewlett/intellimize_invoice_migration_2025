import Stripe from 'stripe'; // TODO: Update to stripe-acacia if executing in Webflow monorepo
import { migrationMappings } from '../mappings';
import { MigrationResultsRecorder } from '../util/migration-results-recorder.util';
import { executionControl } from '../config/execution-control.config';

/**
 * Transforms an invoice to a create invoice request object.
 * @param sourceInvoice - The source invoice to transform
 * @returns The request object to create the invoice
 */
function transformInvoiceToCreateInvoiceRequestObject(sourceInvoice: Stripe.Invoice): Stripe.InvoiceCreateParams {

    const destinationCustomerId = migrationMappings.customerMappings[sourceInvoice.customer as string];
    const destinationSubscriptionId = migrationMappings.subscriptionMappings[sourceInvoice.subscription as string];

    if (!destinationCustomerId) {
        throw new Error(`Destination customer not found for invoice ${sourceInvoice.id}`);
    }

    if (!destinationSubscriptionId) {
        throw new Error(`Destination subscription not found for invoice ${sourceInvoice.id}`);
    }

    let destinationInvoiceNumber: string = (sourceInvoice.number || 'inv') + '-' + Date.now().toString();
    destinationInvoiceNumber = destinationInvoiceNumber.substring(0, 26);

    let invoiceCreateParams: Stripe.InvoiceCreateParams = {
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

    // If we are executing a dry run, we need to exclude the invoice from ARR. This is a special metadata field that is already used to
    // exclude invoices from ARR calculations.
    if (!executionControl.shouldFinalizeInvoice()) {
        invoiceCreateParams.metadata = {
            ...invoiceCreateParams.metadata,
            is_arr_excluded: 'true',
        };
    }

    return invoiceCreateParams;
}

/**
 * Transforms an invoice line items to a create invoice line items request object.
 * @param sourceInvoice - The source invoice to transform
 * @returns The request object to create the invoice line items
 */
async function transformInvoiceLineItems(sourceInvoice: Stripe.Invoice): Promise<Stripe.InvoiceAddLinesParams> {

    const missingPriceMappings: string[] = sourceInvoice.lines.data
        .map((line) => line.price?.id as string)
        .filter((priceId) => !migrationMappings.priceMappings[priceId]);

    if (missingPriceMappings.length > 0) {
        throw new Error(`Missing price mappings for source invoice ${sourceInvoice.id}: ${missingPriceMappings.join(', ')}`);
    }

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

/**
 * Credit the customer account for an invoice amount. This is required to pay the invoice in the destination account without
 * seeking to collect payment from the customer.
 * @param destinationStripe - The destination Stripe client
 * @param invoice - The invoice to credit
 */
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

/**
 * Pays an invoice.
 * @param destinationStripe - The destination Stripe client
 * @param invoice - The invoice to pay
 * @returns The paid invoice
 */
async function payInvoice(destinationStripe: Stripe, invoice: Stripe.Invoice): Promise<Stripe.Invoice> {
    await creditCustomerAccountForInvoice(destinationStripe, invoice);
    return await destinationStripe.invoices.pay(invoice.id, {
        paid_out_of_band: true
    });
}

/**
 * Voids a draft invoice. This is only done in dry runs.
 * @param destinationStripe - The destination Stripe client
 * @param invoice - The invoice to void
 */
async function voidDraftInvoice(destinationStripe: Stripe, invoice: Stripe.Invoice): Promise<Stripe.Invoice> {
    // Finalize the invoice to make it eligible for voiding
    await destinationStripe.invoices.finalizeInvoice(invoice.id, { auto_advance: false });
    return await destinationStripe.invoices.voidInvoice(invoice.id);
}

async function markInvoiceAsUncollectible(destinationStripe: Stripe, invoice: Stripe.Invoice): Promise<Stripe.Invoice> {
    // Finalize the invoice to make it eligible for marking as uncollectible
    await destinationStripe.invoices.finalizeInvoice(invoice.id, { auto_advance: false });
    return await destinationStripe.invoices.markUncollectible(invoice.id);
}

async function openInvoice(destinationStripe: Stripe, invoice: Stripe.Invoice): Promise<Stripe.Invoice> {
    return await destinationStripe.invoices.finalizeInvoice(invoice.id, { auto_advance: false });
}

/**
 * Determines if an invoice should be migrated. Only paid invoices with no discounts are migrated.
 * @param invoice - The invoice to check
 * @returns True if the invoice should be migrated, false otherwise
 */
function shouldMigrateInvoice(invoice: Stripe.Invoice): boolean {

    if (invoice.discounts?.length > 0) {
        return false;
    }

    return true;
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
            let migratedInvoice: Stripe.Invoice = await this.destinationStripe.invoices.create(transformedInvoice);
            try {
                migratedInvoice = await this.destinationStripe.invoices.addLines(migratedInvoice.id, transformedLineItems);
            }
            catch (error) {
                // If an error occurs when adding line items to the invoice, void the invoice and throw the error
                console.error(`Error adding line items to invoice ${migratedInvoice.id}, migrated from ${originalInvoice.id}. Voiding invoice.`);
                this.migrationResultsRecorder.recordFailedMigrationResult(originalInvoice, error as Error);

                await voidDraftInvoice(this.destinationStripe, migratedInvoice);
                throw error;
            }

            // Only pay the invoice if the execution control flag is set
            if (executionControl.shouldFinalizeInvoice()) {
                migratedInvoice = await openInvoice(this.destinationStripe, migratedInvoice);
                switch (originalInvoice.status) {
                    case 'paid':
                        migratedInvoice = await payInvoice(this.destinationStripe, migratedInvoice);
                        break;
                    case 'uncollectible':
                        migratedInvoice = await markInvoiceAsUncollectible(this.destinationStripe, migratedInvoice);
                        break;
                    case 'void':
                        migratedInvoice = await voidDraftInvoice(this.destinationStripe, migratedInvoice);
                        break;
                    case 'open':
                        migratedInvoice = await openInvoice(this.destinationStripe, migratedInvoice);
                        break;
                    default:
                        throw new Error(`Unexpected invoice status: ${originalInvoice.status}`);
                }
            }

            // Record the migration result
            this.migrationResultsRecorder.recordMigrationResult(originalInvoice, migratedInvoice);
            console.log(`Migrated invoice ${originalInvoice.id} to ${migratedInvoice.id}`);

            // Void the invoice if we are not paying it in this execution
            if (!executionControl.shouldFinalizeInvoice()) {
                await voidDraftInvoice(this.destinationStripe, migratedInvoice);
                console.log(`Voided test invoice ${migratedInvoice.id} from destination account`);
            }

            return migratedInvoice;
        } catch (error) {
            console.error(`Error migrating invoice ${originalInvoice.id}: ${error}`);

            this.migrationResultsRecorder.recordFailedMigrationResult(originalInvoice, error as Error);

            return null;
        }
    }

    async migrateAllInvoicesForCustomers(customerMappings: Record<string, string>): Promise<void> {
        for (const [fromCustomerId, toCustomerId] of Object.entries(customerMappings)) {
            console.log(`Migrating invoices for customer ${fromCustomerId} to ${toCustomerId}`);

            const invoiceList = await this.sourceStripe.invoices.list({
                customer: fromCustomerId,
            });

            for (const sourceInvoice of invoiceList.data) {
                if (!shouldMigrateInvoice(sourceInvoice)) {
                    console.log(`Skipping invoice ${sourceInvoice.id}`);
                    continue;
                }

                await this.migrateInvoice(sourceInvoice);
            }
        }
    }
}
