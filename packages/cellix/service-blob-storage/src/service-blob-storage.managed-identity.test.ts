import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ServiceBlobStorage } from './service-blob-storage.ts';

// Unit test for managed identity path: ensure we construct a TokenCredential-backed client

describe('ServiceBlobStorage managed identity flow', () => {
	let service: ServiceBlobStorage | undefined;
	beforeAll(async () => {
		service = new ServiceBlobStorage({ accountName: 'devstoreaccount1' });
		await service.startUp();
	});

	afterAll(async () => {
		if (service) {
			await service.shutDown();
		}
	});

	it('constructs a BlobServiceClient with the expected URL', () => {
		// Access the internal blobServiceClient and ensure the URL was built from accountName
		// This verifies we used the token-credential flow instead of connection string
		expect(service).toBeDefined();
		const url = service?.blobServiceClient.url;
		expect(url).toBe('https://devstoreaccount1.blob.core.windows.net/');
	});

	it('throws when attempting to create SAS URLs without connection string', async () => {
		expect(service).toBeDefined();
		await expect(service?.createBlobReadSasUrl({ containerName: 'c', blobName: 'b', expiresOn: new Date(Date.now() + 1000) })).rejects.toThrow();
	});
});
