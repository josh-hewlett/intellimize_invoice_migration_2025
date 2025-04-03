// @ts-ignore Needed due to moduleResolution Node vs Bundler
import Stripe from 'stripe';
import { FileManager, SummaryGenerator } from '.';
import path from 'path';

type MigrationRecord = {
    original: Stripe.Invoice;
    migrated: Stripe.Invoice;
};

type FailedMigrationRecord = {
    originalInvoice: Stripe.Invoice;
    error: Error;
};

export class MigrationResultsRecorder {
    private static instance: MigrationResultsRecorder;
    private results: MigrationRecord[] = [];
    private failedResults: FailedMigrationRecord[] = [];

    private constructor() { }

    static getInstance(): MigrationResultsRecorder {
        if (!MigrationResultsRecorder.instance) {
            MigrationResultsRecorder.instance = new MigrationResultsRecorder();
        }
        return MigrationResultsRecorder.instance;
    }

    recordMigrationResult(
        original: Stripe.Invoice,
        migrated: Stripe.Invoice
    ): void {
        // Add the migration results to the customer results
        this.results.push({ original, migrated });
    }

    recordFailedMigrationResult(original: Stripe.Invoice, error: Error): void {
        this.failedResults.push({ originalInvoice: original, error });
    }

    writeResultsToFiles(outputDirectory: string): void {
        for (const result of this.results) {
            // Create the customer directory and the original and migrated invoices files
            const originalInvoicesPath = path.join(
                outputDirectory,
                `${result.original.id}.original.json`
            );
            const migratedInvoicesPath = path.join(
                outputDirectory,
                `${result.original.id}.migrated.json`
            );

            // Write the original and migrated invoices to the customer directory
            FileManager.writeToFile(originalInvoicesPath, result.original);
            FileManager.writeToFile(migratedInvoicesPath, result.migrated);
        }

        // write all errors to a file
        const errorsPath = path.join(outputDirectory, `errors.json`);
        FileManager.writeToFile(errorsPath, this.failedResults);
    }

    generateSummaryReport(outputDirectory: string): void {
        const comparisonFile = FileManager.initializeFile(
            outputDirectory,
            `summary_${Date.now()}.csv`
        );

        for (const result of this.results) {
            SummaryGenerator.addResultToSummaryFile(
                comparisonFile,
                result.original,
                result.migrated
            );
        }
    }
}
