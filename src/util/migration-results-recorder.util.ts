import Stripe from 'stripe';
import { FileManager } from './file-manager.util';
import path from 'path';
import { SummaryGenerator } from './summary-generator.util';

type MigrationRecord = {
    original: Stripe.Invoice;
    migrated: Stripe.Invoice;
}

export class MigrationResultsRecorder {

    private static instance: MigrationResultsRecorder;
    private results: MigrationRecord[] = [];

    private constructor() {
    }

    static getInstance(): MigrationResultsRecorder {
        if (!MigrationResultsRecorder.instance) {
            MigrationResultsRecorder.instance = new MigrationResultsRecorder();
        }
        return MigrationResultsRecorder.instance;
    }

    recordMigrationResult(original: Stripe.Invoice, migrated: Stripe.Invoice): void {
        const customerId = original.customer as string;

        // Add the migration results to the customer results
        this.results.push({ original, migrated });
    }

    writeResultsToFiles(outputDirectory: string): void {

        for (const result of this.results) {

            // Create the customer directory and the original and migrated invoices files
            const customerOriginalInvoicesPath = path.join(outputDirectory, `${result.original.id}.original.json`);
            const customerMigratedInvoicesPath = path.join(outputDirectory, `${result.original.id}.migrated.json`);

            // Write the original and migrated invoices to the customer directory
            FileManager.writeToFile(customerOriginalInvoicesPath, result.original);
            FileManager.writeToFile(customerMigratedInvoicesPath, result.migrated);
        }
    }

    generateSummaryReport(outputDirectory: string): void {

        const comparisonFile = FileManager.initializeFile(outputDirectory, `summary_${Date.now()}.csv`);

        for (const result of this.results) {
            SummaryGenerator.addResultToSummaryFile(comparisonFile, result.original, result.migrated);
        }
    }
}