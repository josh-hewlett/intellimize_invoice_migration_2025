import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import Stripe from 'stripe';
import { FileManager } from './file-manager.util';
// Global configuration
const CSV_FILENAME = 'stripe_invoice_comparison.csv';
const CSV_PATH = path.join(process.cwd(), 'output', CSV_FILENAME);

/*
 * Validators
 */
function validateEqual(original: any, migrated: any): boolean {
    return original === migrated;
}

/*
 * Transformers
 */
function transformEpochSecondsToDate(value: any): any {
    return new Date(value * 1000).toISOString();
}

function transformCurrencyValueToString(value: number): any {
    // tranform currency value in cents to dollars
    return `\$${(value / 100).toFixed(2)}`;
}

/*
 * Field Definitions for validation
 */

// Type for field definition
type FieldDefinition = {
    title: string;
    path: string;
    validate?: (original: any, migrated: any) => boolean;
    transform?: (value: any) => any;
};

// Fields to extract and compare
const FIELDS_TO_COMPARE: FieldDefinition[] = [
    {
        title: 'Invoice ID',
        path: 'id'
    },
    {
        title: 'Invoice Number',
        path: 'number',
        validate: validateEqual
    },
    {
        title: 'Customer ID',
        path: 'customer' // Add customer mapping validation
    },
    {
        title: 'Customer Name',
        path: 'customer_name',
        validate: (original, migrated) => original === migrated
    },
    {
        title: 'Subscription ID',
        path: 'subscription',
        validate: (original, migrated) => true // TODO: Add validation with mappers
    },
    {
        title: 'Status',
        path: 'status',
        validate: validateEqual
    },
    {
        title: 'Total',
        path: 'total',
        validate: validateEqual,
        transform: transformCurrencyValueToString
    },
    {
        title: 'Currency',
        path: 'currency',
        validate: validateEqual
    },
    {
        title: 'Subtotal',
        path: 'subtotal',
        validate: validateEqual,
        transform: transformCurrencyValueToString
    },
    {
        title: 'Subtotal Excluding Tax',
        path: 'subtotal_excluding_tax',
        validate: validateEqual,
        transform: transformCurrencyValueToString
    },
    {
        title: 'Taxes',
        path: 'tax',
        validate: validateEqual,
        transform: transformCurrencyValueToString
    },
    {
        title: 'Discount',
        path: 'discount',
        validate: validateEqual,
        transform: transformCurrencyValueToString
    },
    {
        title: 'Effective At',
        path: 'effective_at',
        transform: transformEpochSecondsToDate
    },
    {
        title: 'Created Date',
        path: 'created',
        transform: transformEpochSecondsToDate
    },
    {
        title: 'Due Date',
        path: 'due_date',
        transform: transformEpochSecondsToDate
    },
    {
        title: 'Period Start',
        path: 'period_start',
        validate: validateEqual,
        transform: transformEpochSecondsToDate
    },
    {
        title: 'Period End',
        path: 'period_end',
        validate: validateEqual,
        transform: transformEpochSecondsToDate
    },
    {
        title: 'Amount Due',
        path: 'amount_due',
        validate: validateEqual,
        transform: transformCurrencyValueToString
    },
    {
        title: 'Amount Paid',
        path: 'amount_paid',
        transform: transformCurrencyValueToString
    },
    {
        title: 'Collection Method',
        path: 'collection_method',
        validate: (_original, migrated) => migrated === 'send_invoice'
    },
    {
        title: 'Paid out of band',
        path: 'paid_out_of_band',
        validate: (_original, migrated) => migrated
    },
    {
        title: 'Description',
        path: 'description',
        validate: (original, migrated) => original === migrated
    },
    {
        title: 'Metadata',
        path: 'metadata',
        // transform metadata to a string of key=value pairs separated by | and remove commas (because CSV...)
        transform: (value: any) => Object.entries(value).map(([key, value]) => `${key}=${value}`).join('|').replace(/,/g, '')
    }
];

// Helper function to get nested object value
function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

// Helper function to get validation result
function getValidationResult(field: FieldDefinition, originalValue: any, migratedValue: any): string {
    if (!field.validate) return '';
    return field.validate(originalValue, migratedValue) ? '✅' : '❌';
}

function getTransformedValue(field: FieldDefinition, value: any): any {
    if (!field.transform) return new String(value);
    return field.transform(value);
}


export class SummaryGenerator {

    /**
     * Compares original and migrated Stripe invoices and writes the comparison to a CSV file
     * @param originalInvoice The original Stripe invoice
     * @param migratedInvoice The migrated Stripe invoice
     */
    static addResultToSummaryFile(
        fileName: string,
        originalInvoice: Stripe.Invoice,
        migratedInvoice: Stripe.Invoice
    ): void {

        // Prepare CSV rows
        let headerRow: string[] = [];
        let originalRow: string[] = [];
        let migratedRow: string[] = [];
        let validationRow: string[] = [];

        // For each field, create four rows: title, original value, migrated value, and validation result
        FIELDS_TO_COMPARE.forEach(field => {
            const originalValue = getNestedValue(originalInvoice, field.path);
            const migratedValue = getNestedValue(migratedInvoice, field.path);
            const validationResult = getValidationResult(field, originalValue, migratedValue);

            headerRow.push(field.title);
            originalRow.push(getTransformedValue(field, originalValue));
            migratedRow.push(getTransformedValue(field, migratedValue));
            validationRow.push(validationResult);
        });

        const fileContent = [headerRow.join(','), originalRow.join(','), migratedRow.join(','), validationRow.join(',')].join('\n');

        // Write rows to CSV file
        FileManager.appendToFile(fileName, fileContent + '\n\n');
    }
}