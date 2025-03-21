import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

interface ExecutionControlOptions {
    mode: 'production' | 'test';
    shouldFinalizeInvoices: boolean;
}

export class ExecutionControl {
    private options: ExecutionControlOptions;

    constructor() {
        console.log('Initializing execution control');
        this.options = this.parseArguments();
        console.log('Execution control options:', this.options);
    }

    private parseArguments(): ExecutionControlOptions {
        return yargs(hideBin(process.argv))
            .options({
                shouldFinalizeInvoices: {
                    type: 'boolean',
                    default: false,
                    description: 'Finalize invoices after migration. This will transition the invoice to its final state.'
                        + ' If false, the draft invoice will be voided after migration.'
                },
                mode: {
                    type: 'string',
                    choices: ['production', 'test'],
                    default: 'test',
                    description: 'Set runtime environment'
                },
            })
            .parseSync() as ExecutionControlOptions;
    }

    // Getter methods
    public shouldFinalizeInvoice(): boolean {
        return this.options.shouldFinalizeInvoices;
    }

    public getMode(): string {
        return this.options.mode;
    }
}

const executionControl = new ExecutionControl();

if (executionControl.getMode() === 'test') {
    Error.stackTraceLimit = 50;
}

// Export a singleton instance
export { executionControl };
