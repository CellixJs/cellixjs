const _blobStorageConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
if (!_blobStorageConnectionString) {
	throw new Error('Missing AZURE_STORAGE_CONNECTION_STRING environment variable');
}

export const blobStorageConnectionString: string = _blobStorageConnectionString;
