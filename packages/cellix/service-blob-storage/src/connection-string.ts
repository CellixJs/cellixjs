import { StorageSharedKeyCredential } from '@azure/storage-blob';

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
