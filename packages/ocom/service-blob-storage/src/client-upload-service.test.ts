import { describe, expect, it, vi } from 'vitest';
import { ServiceBlobStorageClientUpload } from './client-upload-service.ts';

vi.mock('@cellix/service-blob-storage', () => ({
	ClientUploadSigner: vi.fn().mockImplementation(() => ({
		createBlobWriteSasUrl: vi.fn().mockResolvedValue('https://example.blob.core.windows.net/container/blob?sv=2021-06-08&sig=test'),
		createBlobReadSasUrl: vi.fn().mockResolvedValue('https://example.blob.core.windows.net/container/blob?sv=2021-06-08&sig=test'),
	})),
}));

describe('ServiceBlobStorageClientUpload', () => {
	// Valid Azurite connection string format
	const validConnectionString =
		'DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1/';

	it('should implement ClientUploadService and ServiceBase interfaces', () => {
		// Check that the class has required methods
		expect(ServiceBlobStorageClientUpload.prototype).toHaveProperty('startUp');
		expect(ServiceBlobStorageClientUpload.prototype).toHaveProperty('shutDown');
		expect(ServiceBlobStorageClientUpload.prototype).toHaveProperty('createUploadUrl');
		expect(ServiceBlobStorageClientUpload.prototype).toHaveProperty('createReadUrl');
	});

	it('should throw when connection string is empty', () => {
		expect(() => {
			new ServiceBlobStorageClientUpload('');
		}).toThrow();
	});

	it('should execute lifecycle methods successfully', async () => {
		const service = new ServiceBlobStorageClientUpload(validConnectionString);

		await expect(service.startUp()).resolves.toBeUndefined();
		await expect(service.shutDown()).resolves.toBeUndefined();
	});

	it('should delegate createUploadUrl to signer', async () => {
		const service = new ServiceBlobStorageClientUpload(validConnectionString);
		const expiresOn = new Date(Date.now() + 3600000); // 1 hour from now
		const request = { containerName: 'uploads', blobName: 'test.txt', expiresOn };

		const result = await service.createUploadUrl(request);
		expect(typeof result).toBe('string');
		expect(result).toContain('sv='); // SAS URL should contain SAS parameters
	});

	it('should delegate createReadUrl to signer', async () => {
		const service = new ServiceBlobStorageClientUpload(validConnectionString);
		const expiresOn = new Date(Date.now() + 3600000); // 1 hour from now
		const request = { containerName: 'uploads', blobName: 'test.txt', expiresOn };

		const result = await service.createReadUrl(request);
		expect(typeof result).toBe('string');
		expect(result).toContain('sv='); // SAS URL should contain SAS parameters
	});
});
