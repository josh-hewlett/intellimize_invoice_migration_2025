const productMappings: Record<string, string> = {
    'prod_QwkajdcCUzA5ZZ': 'prod_Qrm873t8MImCM8',
    'prod_QiPqHYIpVk540D': 'prod_QvXCNxgJSFZkwF',
    'prod_Qi7JTYu5kkMhYH': 'prod_RqAzyM7sJ31nGf',
    'prod_QZtjz247hVZpQ3': 'prod_RqB1JAMJRnssRO',
    'prod_Q1hLTqhoKyWQM8': 'prod_RqB2eX5BNM9iom',
    'prod_Q1hIjdt8CdZ3iL': 'prod_RqB3MUUdbLc9oy',
    'prod_Q1O2jQCiadorPr': 'prod_RqB3Bw5ECREcCo',
    'prod_Q1O1aQXQangCHA': 'prod_RqB47NpuEHF6r1',
    'prod_Q1O1JbhGodmhhV': 'prod_RqB5AmePwGqUOQ',
    'prod_Q1O0gF27r5IwS8': 'prod_RqB5hgUzHMgCO3',
    'prod_Q1O0Bm689K80gN': 'prod_RqB6lRHQB7ZMZX',
    'prod_Q1Nz4EAxhSWi91': 'prod_RqB7Zmuo7o3uZY'
}

// TODO: Add mappings for "already exists" customers
const customerMappings: Record<string, string> = {
    'cus_R5hUa9cTnTe4io': 'cus_R5hUa9cTnTe4io',
    'cus_R4tmX0mnjisgkr': 'cus_R4tmX0mnjisgkr',
    'cus_QzdsYYmw1653dU': 'cus_QzdsYYmw1653dU',
    'cus_QwkZH2CFrSSmBF': 'cus_QwkZH2CFrSSmBF',
    'cus_QnIIHWVcAQb6A7': 'cus_QnIIHWVcAQb6A7',
    'cus_QmxtuSk1w4UKdX': 'cus_QmxtuSk1w4UKdX',
    'cus_QiPov49wjDJb9R': 'cus_QiPov49wjDJb9R',
    'cus_Qi7MuwRY6UuBDq': 'cus_Qi7MuwRY6UuBDq',
    'cus_QbfsnMndrHnJKs': 'cus_QbfsnMndrHnJKs',
    'cus_QbfXtPcIjBzhJ8': 'cus_QbfXtPcIjBzhJ8',
    'cus_QaEF0cLHm9qirh': 'cus_QaEF0cLHm9qirh',
    'cus_QZtcKpedkKL3uN': 'cus_QZtcKpedkKL3uN',
    'cus_QZtVJafBOu5oD3': 'cus_QZtVJafBOu5oD3',
    'cus_QZUm4H1cy2WZ4p': 'cus_QZUm4H1cy2WZ4p',
    'cus_QXECmkx20B2San': 'cus_QXECmkx20B2San',
    'cus_QOutaQMkLHJBob': 'cus_QOutaQMkLHJBob',
    'cus_QOFNN9CXVMfX7o': 'cus_QOFNN9CXVMfX7o',
    'cus_QM2Gz4HivAD4vL': 'cus_QM2Gz4HivAD4vL',
    'cus_QMJv51dWGkn4Mv': 'cus_QMJv51dWGkn4Mv',
    'cus_QMJmWtLV0wxtqd': 'cus_QMJmWtLV0wxtqd',
    'cus_QMJd3IWPyt8Cao': 'cus_QMJd3IWPyt8Cao',
    'cus_QJPFqGm5jXEcXQ': 'cus_QJPFqGm5jXEcXQ',
    'cus_QHW2tNhfM24XWT': 'cus_QHW2tNhfM24XWT',
    'cus_Q1stiUym7CnTa8': 'cus_Q1stiUym7CnTa8',
    'cus_Q2Y31MBvSzZxW0': 'cus_Q2Y31MBvSzZxW0',
    'cus_OZqoRZn4McPdj9': 'cus_OZqoRZn4McPdj9',
    'cus_Oau6z7rahUgBn7': 'cus_Oau6z7rahUgBn7',
    'cus_ObUS6Oc3ZFdZXU': 'cus_ObUS6Oc3ZFdZXU',
    'cus_OhgfqGt1oYP5dO': 'cus_OhgfqGt1oYP5dO',
    'cus_OtK8DcByHWIs3p': 'cus_OtK8DcByHWIs3p',
    'cus_P6WT6rI0XUBuyI': 'cus_P6WT6rI0XUBuyI',
    'cus_P6heu4x2viL1rx': 'cus_P6heu4x2viL1rx',
    'cus_PDuZEL131cQJMG': 'cus_PDuZEL131cQJMG',
    'cus_PEKVApXsgGywPK': 'cus_PEKVApXsgGywPK',
    'cus_POUKP0EowbIZmE': 'cus_POUKP0EowbIZmE',
    'cus_PP8aUCw1seaQcN': 'cus_PP8aUCw1seaQcN',
    'cus_PQdoLjQP8z8HZt': 'cus_PQdoLjQP8z8HZt',
    'cus_PQyUYrRr5IwDUn': 'cus_PQyUYrRr5IwDUn',
    'cus_PT6VgG3QiBIK0U': 'cus_PT6VgG3QiBIK0U',
    'cus_PTHg69iLYLkKEk': 'cus_PTHg69iLYLkKEk',
    'cus_PUOUqSmVf3Eaxz': 'cus_PUOUqSmVf3Eaxz',
    'cus_PYuET7CSaa2xQT': 'cus_PYuET7CSaa2xQT',
    'cus_PdRwYsK8daJDa3': 'cus_PdRwYsK8daJDa3',
    'cus_Ped34WPAC01Qmp': 'cus_Ped34WPAC01Qmp',
    'cus_PhYsaS0RLiOmsR': 'cus_PhYsaS0RLiOmsR',
    'cus_Q1gwwx0wSUi1A9': 'cus_Q1gwwx0wSUi1A9',
    'cus_Q1gsZABAuFJKsS': 'cus_Q1gsZABAuFJKsS',
    'cus_Q1glf89YBMvUl5': 'cus_Q1glf89YBMvUl5',
    'cus_Q1gkMCsLwp5pgg': 'cus_Q1gkMCsLwp5pgg',
    'cus_Q1giidTZboEuJC': 'cus_Q1giidTZboEuJC',
    'cus_Q1geTxC9MdQ5ub': 'cus_Q1geTxC9MdQ5ub',
    'cus_Q1gcPj2VqqwWLi': 'cus_Q1gcPj2VqqwWLi',
    'cus_Q1OGZ6e4dyKezV': 'cus_Q1OGZ6e4dyKezV'
};

// Josh's workspace -> Intellimize Destination Workspace
const testCustomerMappings: Record<string, string> = {
    'cus_Rnuw8mskNlx5cN': 'cus_RvnlTO88Ymdhnv'
};

/*
 * TODO: Add mappings for Subscription IDs and Price IDs
 */

const pricePlanIdMappings: Record<string, string> = {
}

const subscriptionIdMappings: Record<string, string> = { }

export { productMappings, customerMappings, testCustomerMappings };