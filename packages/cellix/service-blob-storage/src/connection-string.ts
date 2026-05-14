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
	for (const segment of segments) {
		const [segmentKey, ...valueParts] = segment.split('=');
		if (segmentKey === key) {
			return valueParts.join('=');
		}
	}
	return undefined;
}
