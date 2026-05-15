/**
 * Blob Storage Configuration
 *
 * Both environment variables are required in all deployment scenarios:
 *
 * - AZURE_STORAGE_ACCOUNT_NAME: Required for blob URL construction and used by managed identity in production.
 *   Provided by Bicep auto-injection in deployed environments.
 *
 * - AZURE_STORAGE_CONNECTION_STRING: Required for SAS token generation (shared-key signing for client uploads).
 *   Sourced from Key Vault in production, local env in development.
 *
 * Authentication strategy is determined by environment and how these values are consumed:
 * - Production: ServiceBlobStorage uses only accountName → DefaultAzureCredential (managed identity)
 * - Local/Azurite: ServiceBlobStorage uses only connectionString → BlobServiceClient.fromConnectionString()
 * - SAS signing: Always uses connectionString directly, regardless of environment
 *
 * @remarks
 * The OCOM adapter layer splits these credentials appropriately to ensure managed identity is used in
 * production (avoiding unnecessary shared-key auth on the SDK client) while maintaining connection-string-based
 * SAS signing for secure client uploads.
 */

const storageAccountName = process.env['AZURE_STORAGE_ACCOUNT_NAME'];
const storageConnectionString = process.env['AZURE_STORAGE_CONNECTION_STRING'];

if (!storageAccountName) {
	throw new Error('Missing AZURE_STORAGE_ACCOUNT_NAME environment variable. Required for blob operations and managed identity.');
}

if (!storageConnectionString) {
	throw new Error('Missing AZURE_STORAGE_CONNECTION_STRING environment variable. Required for SAS token generation (shared-key signing).');
}

export const blobStorageConfig = {
	accountName: storageAccountName,
	connectionString: storageConnectionString,
};
