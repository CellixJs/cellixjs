/**
 * Blob Storage Configuration
 *
 * Two separate concerns require different credentials:
 *
 * 1. Backend blob operations (read/write/delete):
 *    - Production: Uses AZURE_STORAGE_ACCOUNT_NAME with managed identity (DefaultAzureCredential)
 *    - Local: Uses AZURE_STORAGE_CONNECTION_STRING with Azurite
 *
 * 2. Client upload SAS token generation:
 *    - Requires AZURE_STORAGE_CONNECTION_STRING to sign tokens with shared key
 *    - Needed in both production (Key Vault-backed) and local (Azurite)
 */

const storageAccountName = process.env['AZURE_STORAGE_ACCOUNT_NAME'];
const storageConnectionString = process.env['AZURE_STORAGE_CONNECTION_STRING'];

if (!storageConnectionString) {
	throw new Error('Missing AZURE_STORAGE_CONNECTION_STRING environment variable. Required for client upload SAS token generation (both local and production).');
}

if (!storageAccountName) {
	throw new Error('Missing AZURE_STORAGE_ACCOUNT_NAME environment variable. Required for backend blob operations with managed identity (production) or Azurite (local).');
}

export const blobStorageConfig = {
	accountName: storageAccountName,
	connectionString: storageConnectionString,
};
