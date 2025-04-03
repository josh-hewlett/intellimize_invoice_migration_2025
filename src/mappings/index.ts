import { FileManager, logger } from '../util';
import path from 'path';

export type MigrationMappings = {
    customerMappings: Record<string, string>;
    productMappings: Record<string, string>;
    priceMappings: Record<string, string>;
    subscriptionMappings: Record<string, string>;
};

const MAPPINGS_FILE_NAME = 'intellimize_stripe_migration_mappings.json';

let migrationMappingsFromFile: MigrationMappings;
try {
    migrationMappingsFromFile = FileManager.readJsonFile(
        path.join(process.cwd(), MAPPINGS_FILE_NAME)
    );
    if (!migrationMappingsFromFile) {
        throw new Error('No mappings found');
    }

    logger.info(
        `Found mappings at ${path.join(process.cwd(), MAPPINGS_FILE_NAME)}`
    );
} catch (error) {
    logger.error(
        `No mappings found at ${path.join(process.cwd(), MAPPINGS_FILE_NAME)}: ${error}`
    );
    throw error;
}

export const migrationMappings = migrationMappingsFromFile;
