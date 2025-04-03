import yargs from 'yargs';
import { logger } from '../util';

interface ExecutionControlOptions {
    mode: 'production' | 'test';
    shouldFinalizeInvoices: boolean;
    addArrExclusionMetadata: boolean;
    testConnection: boolean;
}

export class ExecutionControl {
    private options: ExecutionControlOptions;

    constructor() {
        logger.info('Initializing execution control');
        this.options = this.parseArguments();
        logger.info('Execution control options:', this.options);
    }

    private parseArguments(): ExecutionControlOptions {
        return yargs(process.argv.slice(2))
            .options({
                shouldFinalizeInvoices: {
                    type: 'boolean',
                    default: false,
                    description:
                        'Finalize invoices after migration. This will transition the invoice to its final state.' +
                        ' If false, the draft invoice will be voided after migration.',
                },
                mode: {
                    type: 'string',
                    choices: ['production', 'test'],
                    default: 'test',
                    description: 'Set runtime environment',
                },
                addArrExclusionMetadata: {
                    type: 'boolean',
                    default: true,
                    description:
                        'Add metadata field to ensure migrated invoice is excluded from ARR calculation pipeline.' +
                        ' This is useful for validating the finalized migrated invoices before "real" wet run.',
                },
                testConnection: {
                    type: 'boolean',
                    default: false,
                    description: 'Test the connection to the source and destination Stripe accounts.',
                },
            })
            .help()
            .version(false).argv as ExecutionControlOptions;
    }

    // Getter methods
    public shouldFinalizeInvoice(): boolean {
        return this.options.shouldFinalizeInvoices;
    }

    public getMode(): 'production' | 'test' {
        return this.options.mode;
    }

    public shouldAddArrExclusionMetadata(): boolean {
        return this.options.addArrExclusionMetadata;
    }

    public isTestConnectionRun(): boolean {
        return this.options.testConnection;
    }
}

const executionControl = new ExecutionControl();

if (executionControl.getMode() === 'test') {
    Error.stackTraceLimit = 50;
}

// Export a singleton instance
export { executionControl };
