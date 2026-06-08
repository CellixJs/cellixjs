/**
 * Blob storage configuration for the API application.
 *
 * The API uses managed identity for server-side blob operations in production
 * and SharedKey signing for non-production environments where Azurite is used
 * for local development and CI.
 */

const { AZURE_STORAGE_ACCOUNT_NAME: accountName, AZURE_STORAGE_CONNECTION_STRING: signingConnectionString } = process.env;

export { accountName, signingConnectionString };
