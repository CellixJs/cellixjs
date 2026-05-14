import { StorageSharedKeyCredential } from '@azure/storage-blob';

export function createCredentialFromConnectionString(connectionString: string): StorageSharedKeyCredential {
	const accountName = getConnectionStringValue(connectionString, 'AccountName');
	const accountKey = getConnectionStringValue(connectionString, 'AccountKey');

	if (!accountName || !accountKey) {
		throw new Error('Blob Storage connection string must include AccountName and AccountKey');
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
