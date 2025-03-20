import Stripe from 'stripe'; // TODO: Update to stripe-acacia
import path from 'path';
import { FileManager } from './util/file-manager.util';
import { InvoiceMigrationService } from './services/invoice-migration.service';
import { MigrationResultsRecorder } from './util/migration-results-recorder.util';
import { config } from './config/config';
import { migrationMappings } from './mappings';

// Initialize Stripe clients for source and destination accounts
const sourceStripe = new Stripe(config.sourceStripeApiKey, { maxNetworkRetries: 3 });

// Define the output directory
const REPORT_OUTPUT_DIR = path.join(__dirname, '..', config.outputDirectory);
const RESULTS_OUTPUT_DIR = path.join(REPORT_OUTPUT_DIR, 'results');
const ERROR_OUTPUT_DIR = path.join(REPORT_OUTPUT_DIR, 'errors');

let migrationResultsRecorder = MigrationResultsRecorder.getInstance();
const invoiceMigrationService = new InvoiceMigrationService(config.sourceStripeApiKey, config.destinationStripeApiKey);

/**
 * Main migration function
 */
async function migrateInvoices(): Promise<void> {
    console.log('Starting Stripe invoice migration...');

    const taxRate = await sourceStripe.taxRates.retrieve("txr_0PHVrdo2ZNzxqgUADbocsNiA");
    console.log(taxRate);

    for (const [fromCustomerId, toCustomerId] of Object.entries(migrationMappings.customerMappings)) {
        console.log(`Processing customer: ${fromCustomerId} -> ${toCustomerId}`);

        try {
            // Fetch all invoices for the customer from the source Stripe account
            const invoiceList = await sourceStripe.invoices.list({
                customer: fromCustomerId,
            });

            console.log(`Found ${invoiceList.data.length} invoices for customer ${fromCustomerId}`);

            // Testing!! Writing results to files for diffing
            const sampleInvoice = invoiceList.data[0];

            await invoiceMigrationService.migrateInvoice(sampleInvoice);



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

            const errorFile = FileManager.initializeFile(ERROR_OUTPUT_DIR, `error_${fromCustomerId}_${Date.now()}.json`);
            FileManager.writeToFile(errorFile, {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                customer: fromCustomerId
            });
        }
    }

    console.log('Invoice migration completed');
}

// Execute the migration
migrateInvoices()
    .then(() => {
        console.log('Migration completed successfully');

        console.log('Writing results to:', RESULTS_OUTPUT_DIR);
        migrationResultsRecorder.writeResultsToFiles(RESULTS_OUTPUT_DIR);

        console.log('Writing summary to:', REPORT_OUTPUT_DIR);
        migrationResultsRecorder.generateSummaryReport(REPORT_OUTPUT_DIR);

        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration failed:', error);
        const fatalErrorFile = FileManager.initializeFile(ERROR_OUTPUT_DIR, `fatal_error_${Date.now()}.json`);
        FileManager.writeToFile(fatalErrorFile, {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });
        process.exit(1);
    });