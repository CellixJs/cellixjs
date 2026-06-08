/**
 * Blob Storage Configuration for @ocom application
 *
 * This application supports client-side uploads with SAS token signing, so both environment variables
 * are required. Server-side blob operations use managed identity through the Azure SDK and only
 * need `AZURE_STORAGE_ACCOUNT_NAME`.
 *
 * Configuration values:
 * - AZURE_STORAGE_ACCOUNT_NAME: Required for blob URL construction and managed identity auth.
 *   Provided by Bicep auto-injection in deployed environments.
 *
 * - AZURE_STORAGE_CONNECTION_STRING: Required for SAS token generation (shared-key signing for client uploads).
 *   This is application-specific based on whether client uploads are supported.
 *   Sourced from Key Vault in production, local env in development.
 *
 * Authentication strategy:
 * - Backend blob operations use managed identity through the Azure SDK.
 * - Client upload signing uses the same `ServiceBlobStorage` class with
 *   signingConnectionString configured explicitly.
 * - This keeps connection-string dependency opt-in for direct-upload flows instead of
 *   coupling it to every server-side blob operation consumer.
 *
 * @remarks
 * To decouple concerns, applications should only require connection string if they implement
 * client uploads. Server-only blob operations require only accountName.
 */

const { AZURE_STORAGE_ACCOUNT_NAME, AZURE_STORAGE_CONNECTION_STRING } = process.env;

if (!AZURE_STORAGE_ACCOUNT_NAME) {
	throw new Error('Missing AZURE_STORAGE_ACCOUNT_NAME environment variable. Required for blob operations with managed identity authentication.');
}

if (!AZURE_STORAGE_CONNECTION_STRING) {
	throw new Error('Missing AZURE_STORAGE_CONNECTION_STRING environment variable. Required for SAS token generation for client uploads.');
}

const accountName = AZURE_STORAGE_ACCOUNT_NAME;
const connectionString = AZURE_STORAGE_CONNECTION_STRING;

export { accountName, connectionString };
