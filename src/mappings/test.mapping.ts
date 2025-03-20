import { MigrationMappings } from "./types.mapping";

const productMappings: Record<string, string> = {
    'prod_QmtRLqlUCQ8O7C': 'prod_QmtRLqlUCQ8O7C'
}

// Josh's workspace -> Intellimize Destination Workspace
const customerMappings: Record<string, string> = {
    'cus_Rnuw8mskNlx5cN': 'cus_RvnlTO88Ymdhnv'
};

const priceMappings: Record<string, string> = {
    'price_0PvJeHo2ZNzxqgUAbHqIvzVk': 'price_0R4RQdo2ZNzxqgUAdOSE9dhs'
}

const subscriptionMappings: Record<string, string> = {
    'sub_0R4Ryro2ZNzxqgUA7rJcjssd': 'sub_0R4Qjso2ZNzxqgUA6qLBd6iv'
}

export const migrationMappings: MigrationMappings = {
    customerMappings,
    productMappings,
    priceMappings,
    subscriptionMappings
}