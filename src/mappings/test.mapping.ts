import { MigrationMappings } from "./types.mapping";

const productMappings: Record<string, string> = {
    'prod_QmtRLqlUCQ8O7C': 'prod_QmtRLqlUCQ8O7C',
    'prod_Q6vVaE1YNdSy2f': 'prod_Q6vVaE1YNdSy2f'
}

// Josh's workspace -> Intellimize Destination Workspace
const customerMappings: Record<string, string> = {
    'cus_Rnuw8mskNlx5cN': 'cus_RvnlTO88Ymdhnv'
};

const priceMappings: Record<string, string> = {
    // Business Hosting Prices
    'price_0PGhe0o2ZNzxqgUAYYuEJf0W': 'price_0R4somo2ZNzxqgUAb3fOSk0g', // Monthly
    'price_0PGhe1o2ZNzxqgUAXk7PTGtY': 'price_0R4soRo2ZNzxqgUABn81tuGV', // Annual
    // Analyze Prices
    'price_0PvJeHo2ZNzxqgUAxt6r2NIh': 'price_0R4sl1o2ZNzxqgUAxyzz6mqK', // Monthly
    'price_0PvJeHo2ZNzxqgUAbHqIvzVk': 'price_0R4RQdo2ZNzxqgUAdOSE9dhs', // Annual
}

const subscriptionMappings: Record<string, string> = {
    'sub_0R4Ryro2ZNzxqgUA7rJcjssd': 'sub_0R4Qjso2ZNzxqgUA6qLBd6iv',
    'sub_0R4sONo2ZNzxqgUAzFoLVt6t': 'sub_0R4Qjso2ZNzxqgUA6qLBd6iv'
}

export const migrationMappings: MigrationMappings = {
    customerMappings,
    productMappings,
    priceMappings,
    subscriptionMappings
}