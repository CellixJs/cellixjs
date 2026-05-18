import { StorageSharedKeyCredential } from '@azure/storage-blob';

/**
 * Parses a Blob Storage connection string and creates a StorageSharedKeyCredential for SAS signing.
 *
 * Requires a shared-key connection string with explicit AccountName and AccountKey.
 * This is used for generating SAS tokens for client uploads.
 *
 * Supported connection string formats:
 * - Full explicit format: "AccountName=value;AccountKey=value;..."
 * - Azurite: Connection string must include explicit AccountName and AccountKey
 *
 * NOT supported:
 * - SAS-token-based connection strings (these cannot generate new SAS tokens)
 * - Shorthand "UseDevelopmentStorage=true" (lacks AccountKey for SAS generation)
 *
 * For SAS token-based workflows, use connection string only for initial Azure SDK client creation
 * (see ServiceBlobStorage with accountName + DefaultAzureCredential for managed identity flows).
 *
 * @throws {Error} If connection string is empty, missing AccountName, or missing AccountKey
 */
export function createCredentialFromConnectionString(connectionString: string): StorageSharedKeyCredential {
	// Validate input early to provide clear error messages
	if (typeof connectionString !== 'string' || !connectionString.trim()) {
		throw new Error('Connection string must be a non-empty string');
	}

	const accountName = getConnectionStringValue(connectionString, 'AccountName');
	const accountKey = getConnectionStringValue(connectionString, 'AccountKey');

	if (!accountName && !accountKey) {
		throw new Error('Blob Storage connection string must include both AccountName and AccountKey');
	}

	if (!accountName) {
		throw new Error('Missing AccountName in Blob Storage connection string');
	}

	if (!accountKey) {
		throw new Error('Missing AccountKey in Blob Storage connection string');
	}

	return new StorageSharedKeyCredential(accountName, accountKey);
}

function getConnectionStringValue(connectionString: string, key: string): string | undefined {
	const segments = connectionString.split(';');
	const targetKey = key.trim().toLowerCase();
	for (const rawSegment of segments) {
		if (!rawSegment) {
			continue; // skip empty segments
		}
		const idx = rawSegment.indexOf('=');
		if (idx === -1) {
			continue; // skip malformed segment
		}
		const segmentKey = rawSegment.substring(0, idx).trim();
		const value = rawSegment.substring(idx + 1).trim();
		if (segmentKey.toLowerCase() === targetKey) {
			return value;
		}
	}
	return undefined;
}

export { getConnectionStringValue };
