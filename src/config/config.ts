import { executionControl } from './execution-control.config';
import * as dotenv from 'dotenv';

dotenv.config();

type Config = {
    sourceStripeApiKey: string;
    destinationStripeApiKey: string;
};

let config: Config;

switch (executionControl.getMode()) {
    case 'test':
        config = {
            sourceStripeApiKey: process.env.SOURCE_STRIPE_API_KEY || '',
            destinationStripeApiKey: process.env.DESTINATION_STRIPE_API_KEY || '',
        };
        break;
    case 'production':
        config = {
            sourceStripeApiKey: process.env.PRODUCTION_SOURCE_STRIPE_API_KEY || '',
            destinationStripeApiKey: process.env.PRODUCTION_DESTINATION_STRIPE_API_KEY || '',
        };
        break;
    default:
        throw new Error(
            `Unexpected value encountered for execution mode: ${executionControl.getMode()}`
        );
}

// Validate the config
if (!config.sourceStripeApiKey || !config.destinationStripeApiKey) {
    throw new Error('Missing environment variables');
}

export default config;
