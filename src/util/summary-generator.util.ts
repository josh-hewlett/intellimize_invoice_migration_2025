import Stripe from 'stripe';
import { FileManager } from './file-manager.util';
import { migrationMappings } from '../mappings';

/*
 * Field Validators
 */
function validateEqual(original: any, migrated: any): boolean {
    return original === migrated;
}

function validatePriceMapping(original: string, migrated: string): boolean {

    return migrated === migrationMappings.priceMappings[original];
}

function validateProductMapping(original: string, migrated: string): boolean {

    return migrated === migrationMappings.productMappings[original];
}

function validateSubscriptionMapping(original: string, migrated: string): boolean {

    return migrated === migrationMappings.subscriptionMappings[original];
}

function validateCustomerMapping(original: string, migrated: string): boolean {

    return migrated === migrationMappings.customerMappings[original];
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
    fieldValueAccumulator?: (value: any[]) => any;
};

// Fields to extract and compare
const TOP_LEVEL_FIELDS_TO_COMPARE: FieldDefinition[] = [
    {
        title: 'Invoice ID',
        path: 'id'
    },
    {
        title: 'Invoice Number',
        path: 'number',
        validate: (original: string, migrated: string) => migrated.startsWith(original)
    },
    {
        title: 'Customer ID',
        path: 'customer',
        validate: validateCustomerMapping
    },
    {
        title: 'Customer Name',
        path: 'customer_name',
        validate: (original, migrated) => original === migrated
    },
    {
        title: 'Subscription ID',
        path: 'subscription',
        validate: validateSubscriptionMapping
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
        transform: transformEpochSecondsToDate
    },
    {
        title: 'Period End',
        path: 'period_end',
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

const LINE_ITEM_FIELDS_TO_COMPARE: FieldDefinition[] = [
    {
        title: 'ID',
        path: 'id'
    },
    {
        title: 'Description',
        path: 'description'
    },
    {
        title: 'Price ID',
        path: 'price.id',
        validate: validatePriceMapping
    },
    {
        title: 'Product ID',
        path: 'price.product',
        validate: validateProductMapping
    },
    {
        title: 'Amount',
        path: 'amount',
        transform: transformCurrencyValueToString,
        validate: validateEqual
    },
    {
        title: 'Quantity',
        path: 'quantity',
        validate: validateEqual
    },
    {
        title: 'Price Unit Amount',
        path: 'price.unit_amount',
        transform: transformCurrencyValueToString,
        validate: validateEqual
    },
    {
        title: 'Total Tax Amount',
        path: 'taxes',
        // Add up all the tax amounts
        fieldValueAccumulator: (value: any[]) => value.reduce((acc: number, tax: any) => acc + tax.amount, 0),
        transform: transformCurrencyValueToString,
        validate: validateEqual
    },
    {
        title: 'Total Discount Amount',
        path: 'discounts',
        // Add up all the discount amounts
        fieldValueAccumulator: (value: any[]) => value.reduce((acc: number, discount: any) => acc + discount.amount, 0),
        transform: transformCurrencyValueToString,
        validate: validateEqual
    },
    {
        title: 'Period Start',
        path: 'period.start',
        validate: validateEqual,
        transform: transformEpochSecondsToDate
    },
    {
        title: 'Period End',
        path: 'period.end',
        validate: validateEqual,
        transform: transformEpochSecondsToDate
    }
];

/**
 * Helper function to get nested object value. Applies fieldValueAccumulator if it exists.
 * @param obj The object to get the value from
 * @param field The field definition
 * @returns The nested value
 */
function getNestedValue(obj: any, field: FieldDefinition): any {
    let rawValue = field.path.split('.').reduce((acc, part) => acc && acc[part], obj);

    if (field.fieldValueAccumulator) {
        return field.fieldValueAccumulator(rawValue);
    }

    return rawValue;
}

/**
 * Helper function to get validation result.
 * Returns '✅' if the value is valid, '❌' if it is not, and '' if no validation is defined.
 * @param field The field definition
 * @param originalValue The original value
 * @param migratedValue The migrated value
 * @returns The validation result
 */
function getValidationResult(field: FieldDefinition, originalValue: any, migratedValue: any): string {
    if (!field.validate) return '';
    return field.validate(originalValue, migratedValue) ? '✅' : '❌';
}

/**
 * Helper function to get transformed value
 * @param field The field definition
 * @param value The value to transform
 * @returns The transformed value
 */
function getTransformedValue(field: FieldDefinition, value: any): any {
    if (!field.transform) return new String(value);
    return field.transform(value);
}

export class SummaryGenerator {

    /**
     * Compares original and migrated Stripe invoices and writes the comparison in CSV format to the provided file ]
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
        TOP_LEVEL_FIELDS_TO_COMPARE.forEach(field => {
            const originalValue = getNestedValue(originalInvoice, field);
            const migratedValue = getNestedValue(migratedInvoice, field);
            const validationResult = getValidationResult(field, originalValue, migratedValue);

            headerRow.push(field.title);
            originalRow.push(getTransformedValue(field, originalValue));
            migratedRow.push(getTransformedValue(field, migratedValue));
            validationRow.push(validationResult);
        });

        // For each line item, add its field data to the summary
        originalInvoice.lines.data.forEach((lineItem, index) => {
            LINE_ITEM_FIELDS_TO_COMPARE.forEach(field => {
                let originalValue = getNestedValue(lineItem, field);
                let migratedValue = getNestedValue(migratedInvoice.lines.data[index], field);

                const validationResult = getValidationResult(field, originalValue, migratedValue);

                headerRow.push(`Line Item ${index} - ${field.title}`);
                originalRow.push(getTransformedValue(field, originalValue));
                migratedRow.push(getTransformedValue(field, migratedValue));
                validationRow.push(validationResult);
            });
        });

        const fileContent = [headerRow.join(','), originalRow.join(','), migratedRow.join(','), validationRow.join(',')].join('\n');

        // Write rows to CSV file
        FileManager.appendToFile(fileName, fileContent + '\n\n');
    }
}