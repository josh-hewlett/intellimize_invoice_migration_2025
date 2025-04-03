import path from 'path';
import { FileManager } from './util/file-manager.util';
import { InvoiceMigrationService } from './services/invoice-migration.service';
import { MigrationResultsRecorder } from './util/migration-results-recorder.util';
import { config } from './config/config';
import { migrationMappings } from './mappings';

/*
 * Define the output directories
 * Results output will look like the following:
 *
 * ${project_root}/results
 *    |- summary_${id}.csv (the overall summary of the migration)
 *    |- details/
 *       |- errors.json (contains all errors for every invoice object)
 *       |- ${invoice_id}.original.json (contains the source invoice object)
 *       |- ${invoice_id}.migrated.json (contains the migrated invoice object)
 *       |- ...
 */
const REPORT_OUTPUT_DIR = path.join(__dirname, '..', 'results');
const RESULTS_OUTPUT_DIR = path.join(REPORT_OUTPUT_DIR, 'details');
const ERROR_OUTPUT_DIR = path.join(REPORT_OUTPUT_DIR, 'errors');

// Initialize the invoice migration service and migration results recorder
const invoiceMigrationService = new InvoiceMigrationService(config.sourceStripeApiKey, config.destinationStripeApiKey);
let migrationResultsRecorder = MigrationResultsRecorder.getInstance();

// Execute the migration
invoiceMigrationService
    .migrateAllInvoicesForCustomers(migrationMappings.customerMappings)
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