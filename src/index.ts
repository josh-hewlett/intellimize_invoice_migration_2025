import Stripe from 'stripe'; // TODO: Update to stripe-acacia
// import config from 'config'; // TODO: Uncomment and pull secrets from here
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { customerMappings, testCustomerMappings, productMappings } from './mappings/mappings';
import { compareInvoices, intializeComparisonFile } from './util/dryRunReporter';
// TODO: Remove this and pull from module
const config = { stripe: { secKey: 'sk_test_41qGQo2ZNzxqgUAwhbOgsp65qN7sv7H6UQZnevEqyNtLWmpXgFq6O5Qu9eiRM28OtH6Wv96rLxZCg2tccIRfrqwDJ00GLnionBM' } };

// Initialize Stripe clients for source and destination accounts
const fromStripe = new Stripe(config.stripe.secKey, { maxNetworkRetries: 3 });
const toStripe = new Stripe(config.stripe.secKey, { maxNetworkRetries: 3 });

/*
 * =================== For testing purposes, we'll write the results to a file in the Documents folder
 */
// Define the output directory
const OUTPUT_DIR = path.join(os.homedir(), 'Documents', 'stripe_migration_playground');

// Ensure the output directory exists
function ensureDirectoryExists(directory: string): void {
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
        console.log(`Created directory: ${directory}`);
    }
}

/**
 * Write data to a JSON file
 */
function writeToFile(filename: string, data: any): void {
    ensureDirectoryExists(OUTPUT_DIR);
    const filePath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Data written to: ${filePath}`);
}

/*
 * ================= End of testing code
 */


function transformInvoiceToCreateInvoiceRequestObject(
    customerId: string,
    sourceInvoice: Stripe.Invoice
): Stripe.InvoiceCreateParams {
    // Create a new invoice with appropriate settings

    return {
        customer: customerId,
        auto_advance: false,
        collection_method: 'send_invoice',
        days_until_due: 30,
        subscription: 'sub_0R4Qjso2ZNzxqgUA6qLBd6iv',
        custom_fields: sourceInvoice.custom_fields || undefined,
        effective_at: sourceInvoice.effective_at || sourceInvoice.created,
        description: sourceInvoice.description || undefined,
        footer: sourceInvoice.footer || undefined,
        // number: sourceInvoice.number || undefined, TODO: Add this back after unique invoice number is implemented
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

let memoizedTaxRates: Record<string, Stripe.TaxRate> = {}

async function transformInvoiceLineItems(
    sourceInvoice: Stripe.Invoice,
    draftMigratedInvoice: Stripe.Invoice
): Promise<Stripe.InvoiceAddLinesParams> {

    // Fetch all TaxRates for the source invoice
    for (const line of sourceInvoice.lines.data) {
        if (line.tax_amounts && line.tax_amounts.length > 0) {
            for (const taxAmount of line.tax_amounts) {
                const taxRateId = taxAmount.tax_rate as string;
                // If we haven't already fetched this tax rate, fetch it and store it in our memoized cache
                if (!memoizedTaxRates[taxRateId]) {
                    const stripeTaxRate = await fromStripe.taxRates.retrieve(taxRateId);
                    memoizedTaxRates[taxRateId] = stripeTaxRate;
                }
            }
        }
    }

    // TODO: Figure out discounts
    const transformedLineItems: Stripe.InvoiceAddLinesParams.Line[] = sourceInvoice.lines.data.map((line) => ({
        // amount: line.amount,
        description: line.description || '',
        price: 'price_0R4RQdo2ZNzxqgUAdOSE9dhs', // line.price?.id || 'fake_id', // TODO: Add price plan ID mapping instead of manual amount
        // price_data: {
        //     currency: line.price?.currency || 'usd',
        //     product: line.price?.product as string || 'fake_id',
        //     unit_amount: line.price?.unit_amount || 1,
        // },
        period: {
            start: line.period?.start,
            end: line.period?.end
        },
        // tax_amounts: draftMigratedInvoice.default_tax_rates ? undefined : line.tax_amounts?.map((tax) => ({
        //     amount: tax.amount,
        //     taxable_amount: tax.taxable_amount || 0,
        //     // Stripe will use these details and either create a new tax rate or use an existing one if one is found with the same details
        //     tax_rate_data: {
        //         display_name: memoizedTaxRates[tax.tax_rate as string].display_name,
        //         inclusive: memoizedTaxRates[tax.tax_rate as string].inclusive,
        //         percentage: memoizedTaxRates[tax.tax_rate as string].percentage,
        //     },
        // }))
    }));

    return {
        lines: transformedLineItems
    }
}

// call balance transaction API to credit customer account for invoice
async function creditCustomerAccountForInvoice(invoice: Stripe.Invoice): Promise<void> {
    await toStripe.customers.createBalanceTransaction(
        invoice.customer as string,
        {
            amount: invoice.amount_due * -1,
            currency: invoice.currency,
            description: `Credit for invoice ${invoice.id}`,
        }
    );
}

async function payInvoice(invoice: Stripe.Invoice): Promise<Stripe.Invoice> {
    await creditCustomerAccountForInvoice(invoice);
    return await toStripe.invoices.pay(invoice.id, {
        paid_out_of_band: true
    });
}

/**
 * Main migration function
 */
async function migrateInvoices(): Promise<void> {
    console.log('Starting Stripe invoice migration...');
    ensureDirectoryExists(OUTPUT_DIR);

    const taxRate = await fromStripe.taxRates.retrieve("txr_0PHVrdo2ZNzxqgUADbocsNiA");
    console.log(taxRate);

    for (const [fromCustomerId, toCustomerId] of Object.entries(testCustomerMappings)) {
        console.log(`Processing customer: ${fromCustomerId} -> ${toCustomerId}`);

        try {
            // Fetch all invoices for the customer from the source Stripe account
            const invoiceList = await fromStripe.invoices.list({
                customer: fromCustomerId,
            });

            console.log(`Found ${invoiceList.data.length} invoices for customer ${fromCustomerId}`);

            // Testing!! Writing results to files for diffing
            const sampleInvoice = invoiceList.data[0];
            writeToFile(`original_invoice.json`, sampleInvoice);

            // Transform and write the transformed invoice to a file
            const transformedInvoice = transformInvoiceToCreateInvoiceRequestObject(
                toCustomerId,
                sampleInvoice as Stripe.Invoice
            );
            writeToFile(`transformed_invoice.json`, transformedInvoice);

            // Create the new invoice in the destination account
            let draftMigratedInvoice = await toStripe.invoices.create(transformedInvoice);
            writeToFile(`migrated_invoice.json`, draftMigratedInvoice);

            // Add line items to the draft invoice
            const transformedLineItems = await transformInvoiceLineItems(sampleInvoice, draftMigratedInvoice);
            draftMigratedInvoice = await toStripe.invoices.addLines(draftMigratedInvoice.id, transformedLineItems);
            writeToFile(`migrated_invoice.json`, draftMigratedInvoice);

            // Pay (finalize) the invoice
            const paidInvoice = await payInvoice(draftMigratedInvoice);
            writeToFile(`paid_migrated_invoice.json`, paidInvoice);

            compareInvoices(sampleInvoice, paidInvoice);




            //         for (const invoice of invoiceList.data) {
            //             // Apply filtering criteria
            //             if (!shouldMigrateInvoice(invoice)) {
            //                 console.log(`Skipping invoice ${invoice.id} - does not meet migration criteria`);
            //                 continue;
            //             }

            //             console.log(`Migrating invoice ${invoice.id}...`);

            //             try {
            //                 // Transform the invoice for the destination account
            //                 const newInvoiceParams = transformInvoiceToCreateInvoiceRequestObject(toCustomerId, invoice);

            //                 // Create the new invoice in the destination account
            //                 const migratedInvoice = await toStripe.invoices.create(newInvoiceParams);
            //                 console.log(`Created new invoice ${migratedInvoice.id}`);

            //                 // Finalize the invoice
            //                 const finalizedInvoice = await toStripe.invoices.finalizeInvoice(migratedInvoice.id);
            //                 console.log(`Finalized invoice ${finalizedInvoice.id}`);

            //                 // Mark the invoice as paid out of band
            //                 const paidInvoice = await toStripe.invoices.pay(migratedInvoice.id, {
            //                     paid_out_of_band: true
            //                 });
            //                 console.log(`Marked invoice ${paidInvoice.id} as paid out of band`);
            //             } catch (error) {
            //                 console.error(`Error migrating invoice ${invoice.id}:`, error);
            //             }
            //         }
        } catch (error) {
            console.error(`Error fetching invoices for customer ${fromCustomerId}:`, error);
            writeToFile(`error_${fromCustomerId}_${Date.now()}.json`, {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                customer: fromCustomerId
            });
        }
    }

    console.log('Invoice migration completed');
}

/**
 * Determine if an invoice should be migrated based on business criteria
 */
function shouldMigrateInvoice(invoice: Stripe.Invoice): boolean {
    // Implement your filtering criteria here
    // For example:

    // Only migrate paid invoices
    if (!invoice.paid) {
        return false;
    }

    // Only migrate invoices from a certain date range
    const invoiceDate = new Date(invoice.created * 1000);
    const cutoffDate = new Date('2023-01-01'); // Example cutoff date
    if (invoiceDate < cutoffDate) {
        return false;
    }

    // Only migrate invoices with a minimum amount
    if (invoice.amount_paid < 100) { // Amount in cents
        return false;
    }

    // Add more criteria as needed

    return true;
}

intializeComparisonFile();
// Execute the migration
migrateInvoices()
    .then(() => {
        console.log('Migration completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration failed:', error);
        writeToFile(`fatal_error_${Date.now()}.json`, {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });
        process.exit(1);
    });