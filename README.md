# Intellimize Invoice Migration Tool

A TypeScript-based tool for migrating invoice data between Stripe accounts. This tool provides a robust solution for transferring invoice records while maintaining data integrity and providing detailed migration reports.

## Features

- Migrate invoices between Stripe accounts using API keys
- Customer ID mapping support
- Detailed migration reporting and error tracking
- Comprehensive error handling and logging
- Progress tracking and resumability
- Output of original and migrated invoice data for verification

## Project Structure

```
.
├── src/
│   ├── index.ts                    # Main application entry point
│   ├── config/                     # Configuration files
│   ├── services/
│   │   └── invoice-migration.service.ts  # Core migration logic
│   ├── mappings/                   # Customer ID mapping definitions
│   └── util/                       # Utility functions and helpers
├── dist/                           # Compiled JavaScript output
├── results/                        # Migration results and reports
├── package.json                    # Project dependencies and scripts
├── tsconfig.json                   # TypeScript configuration
└── README.md                       # Project documentation
```

## Prerequisites

- Source Stripe API Key
- Destination Stripe API Key

## Installation

1. Clone this repository:
   ```bash
   git clone [repository-url]
   cd intellimize_invoice_migration
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the project root with:
   ```
   SOURCE_STRIPE_API_KEY=your_source_api_key
   DESTINATION_STRIPE_API_KEY=your_destination_api_key
   ```

## Usage

1. Configure customer mappings:
   Update the customer mappings in `src/mappings/index.ts` to define the relationship between source and destination customer IDs.

2. Run the migration:
   ```bash
   npm run build
   npm start
   ```

   Or for development:
   ```bash
   npm run dev
   ```

3. Check the results:
   After migration, check the `results` directory for:
   - Summary report (CSV)
   - Detailed migration logs
   - Original and migrated invoice JSON files
   - Error reports (if any)

## Output Structure

The migration tool generates a structured output in the `results` directory:

```
results/
├── summary_[timestamp].csv         # Migration summary report
├── details/                        # Detailed migration data
│   ├── [invoice_id].original.json  # Original invoice data
│   └── [invoice_id].migrated.json  # Migrated invoice data
└── errors/                         # Error logs and reports
```

## Development

### Available Scripts

- `npm run build`: Compile TypeScript to JavaScript
- `npm start`: Run the compiled JavaScript
- `npm run dev`: Run directly with ts-node (development)
- `npm run debug`: Run with debugging enabled

### Dependencies

- `stripe`: Stripe API client
- `dotenv`: Environment variable management
- `typescript`: TypeScript compiler and types
- `ts-node`: TypeScript execution environment

## Error Handling

The tool includes comprehensive error handling:
- Validation of API keys and configurations
- Detailed error logging for failed migrations
- Fatal error capture and reporting
- Separate error files for debugging