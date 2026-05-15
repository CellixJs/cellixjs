/**
 * Blob Storage Configuration for @ocom application
 *
 * This application supports client-side uploads with SAS token signing, so both environment variables
 * are required. Applications that only perform server-side blob operations via managed identity would
 * only need AZURE_STORAGE_ACCOUNT_NAME.
 *
 * Configuration values:
 * - AZURE_STORAGE_ACCOUNT_NAME: Required for blob URL construction and managed identity authentication.
 *   Provided by Bicep auto-injection in deployed environments.
 *
 * - AZURE_STORAGE_CONNECTION_STRING: Required for SAS token generation (shared-key signing for client uploads).
 *   This is application-specific based on whether client uploads are supported.
 *   Sourced from Key Vault in production, local env in development.
 *
 * Authentication strategy:
 * - ServiceBlobStorage always uses managed identity (DefaultAzureCredential) for blob SDK operations
 * - Connection string is used separately for SAS token generation (not for SDK auth)
 *
 * @remarks
 * To decouple concerns, applications should only require connection string if they implement
 * client uploads. Server-only blob operations require only accountName.
 */

const storageAccountName = process.env['AZURE_STORAGE_ACCOUNT_NAME'];
const storageConnectionString = process.env['AZURE_STORAGE_CONNECTION_STRING'];

if (!storageAccountName) {
	throw new Error('Missing AZURE_STORAGE_ACCOUNT_NAME environment variable. Required for blob operations with managed identity authentication.');
}

if (!storageConnectionString) {
	throw new Error('Missing AZURE_STORAGE_CONNECTION_STRING environment variable. Required for SAS token generation for client uploads. ' + '(Applications that only perform server-side blob operations do not require this.)');
}

export const blobStorageConfig = {
	accountName: storageAccountName,
	connectionString: storageConnectionString,
};
