/**
 * Example of converting epoch timestamps in seconds to ISO strings
 * Based on the invoice migration code
 */

// In the original code, we have:
// original_invoice_date: sourceInvoice.created,
// This is an epoch timestamp in seconds

/**
 * Converts an epoch timestamp in seconds to an ISO string
 * @param epochSeconds Epoch timestamp in seconds
 * @returns ISO formatted date string
 */
function convertEpochSecondsToISOString(epochSeconds: number): string {
  // Create a new Date object by multiplying seconds by 1000 to get milliseconds
  const date = new Date(epochSeconds * 1000);

  // Convert to ISO string
  return date.toISOString();
}

// Example usage with a sample epoch timestamp
// Let's use a sample timestamp (January 1, 2023 00:00:00 UTC)
const sampleEpochTimestamp = 1672531200;

// Convert to ISO string
const isoString = convertEpochSecondsToISOString(sampleEpochTimestamp);

console.log('Example of converting epoch timestamp to ISO string:');
console.log(`Epoch timestamp (seconds): ${sampleEpochTimestamp}`);
console.log(`ISO string: ${isoString}`);

// Real-world example from the invoice migration code
console.log('\nIn your invoice migration code:');
console.log('Instead of storing the raw epoch timestamp:');
console.log('original_invoice_date: sourceInvoice.created,');
console.log('\nYou could store the ISO string:');
console.log('original_invoice_date: convertEpochSecondsToISOString(sourceInvoice.created),');

// Export the function for use in other files
export { convertEpochSecondsToISOString };