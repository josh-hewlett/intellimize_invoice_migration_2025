import * as dotenv from 'dotenv';

// Load the environment variables
dotenv.config();

type Config = {
    sourceStripeApiKey: string;
    destinationStripeApiKey: string;
    outputDirectory: string;
}

export const config: Config = {
    sourceStripeApiKey: process.env.SOURCE_STRIPE_API_KEY as string,
    destinationStripeApiKey: process.env.DESTINATION_STRIPE_API_KEY as string,
    outputDirectory: process.env.OUTPUT_DIRECTORY as string,
}

// Validate the config
if (!config.sourceStripeApiKey || !config.destinationStripeApiKey || !config.outputDirectory) {
    throw new Error('Missing environment variables');
}
