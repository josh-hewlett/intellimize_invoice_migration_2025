import { logger, FileManager, MigrationResultsRecorder } from './util';

import path from 'path';
import { InvoiceMigrationService } from './services/invoice-migration.service';
import config from './config/config';
import { migrationMappings } from './mappings';
import { executionControl } from './config/execution-control.config';

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
const REPORT_OUTPUT_DIR = path.join(
    process.cwd(),
    'stripe_intellimize_invoice_migration_results'
);
const RESULTS_OUTPUT_DIR = path.join(REPORT_OUTPUT_DIR, 'details');
const ERROR_OUTPUT_DIR = path.join(REPORT_OUTPUT_DIR, 'errors');

// Initialize the invoice migration service and migration results recorder
const invoiceMigrationService = new InvoiceMigrationService(
    config.sourceStripeApiKey,
    config.destinationStripeApiKey
);
const migrationResultsRecorder = MigrationResultsRecorder.getInstance();

// Execute the migration
if (executionControl.isTestConnectionRun()) {
    invoiceMigrationService.testConnection();
} else {
    logger.info('Starting migration');
    invoiceMigrationService
        .migrateAllInvoicesForCustomers(migrationMappings.customerMappings)
        .then(() => {
            logger.info('Migration completed successfully');
        })
        .catch((error) => {
            logger.error('Migration failed:', error);
            const fatalErrorFile = FileManager.initializeFile(
                ERROR_OUTPUT_DIR,
                `fatal_error_${Date.now()}.json`
            );
            FileManager.writeToFile(fatalErrorFile, {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
            });
            throw new Error('Migration failed: ' + error);
        })
        .finally(() => {
            logger.info('Writing results to:', RESULTS_OUTPUT_DIR);
            migrationResultsRecorder.writeResultsToFiles(RESULTS_OUTPUT_DIR);

            logger.info('Writing summary to:', REPORT_OUTPUT_DIR);
            migrationResultsRecorder.generateSummaryReport(REPORT_OUTPUT_DIR);
        });
}
