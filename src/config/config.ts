import * as dotenv from 'dotenv';

// Load the environment variables
dotenv.config();

type Config = {
    sourceStripeApiKey: string;
    destinationStripeApiKey: string;
    outputDirectory: string;
    mode: 'test' | 'production';
}

export const config: Config = {
    sourceStripeApiKey: process.env.SOURCE_STRIPE_API_KEY as string,
    destinationStripeApiKey: process.env.DESTINATION_STRIPE_API_KEY as string,
    outputDirectory: process.env.OUTPUT_DIRECTORY as string,
    mode: process.env.MODE as 'test' | 'production',
}

// Validate the config
if (!config.sourceStripeApiKey || !config.destinationStripeApiKey || !config.outputDirectory || !config.mode) {
    throw new Error('Missing environment variables');
}

if (config.mode !== 'test' && config.mode !== 'production') {
    throw new Error(`Invalid mode: ${config.mode}. Must be either 'test' or 'production'.`);
}
