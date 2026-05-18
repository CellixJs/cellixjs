import { describe, expect, it, vi } from 'vitest';
import { ServiceBlobStorageClientUpload } from './client-upload-service.js';

vi.mock('@cellix/service-blob-storage', () => ({
	ClientUploadSigner: vi.fn().mockImplementation(() => ({
		createBlobWriteAuthorizationHeader: vi.fn().mockResolvedValue({
			url: 'http://127.0.0.1:10000/devstoreaccount1/test-container/test-blob.txt',
			authorizationHeader: 'SharedKey devstoreaccount1:signature123==',
			headers: {
				'Content-Type': 'application/octet-stream',
				'Content-Length': '1024',
				'x-ms-blob-type': 'BlockBlob',
				'x-ms-version': '2021-04-10',
				'x-ms-date': new Date().toUTCString(),
			},
		}),
		createBlobReadAuthorizationHeader: vi.fn().mockResolvedValue({
			url: 'http://127.0.0.1:10000/devstoreaccount1/test-container/test-blob.txt',
			authorizationHeader: 'SharedKey devstoreaccount1:signature123==',
			headers: {
				'Content-Type': 'application/octet-stream',
				'Content-Length': '1024',
				'x-ms-blob-type': 'BlockBlob',
				'x-ms-version': '2021-04-10',
				'x-ms-date': new Date().toUTCString(),
			},
		}),
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

	it('should delegate createUploadUrl to signer and return auth header', async () => {
		const service = new ServiceBlobStorageClientUpload(validConnectionString);
		const request = { containerName: 'uploads', blobName: 'test.txt', contentLength: 1024, contentType: 'application/octet-stream' };

		const result = await service.createUploadUrl(request);
		expect(result).toHaveProperty('url');
		expect(result).toHaveProperty('authorizationHeader');
		expect(result).toHaveProperty('headers');
		expect(result.authorizationHeader).toMatch(/^SharedKey /);
	});

	it('should delegate createReadUrl to signer and return auth header', async () => {
		const service = new ServiceBlobStorageClientUpload(validConnectionString);
		const request = { containerName: 'uploads', blobName: 'test.txt', contentLength: 1024, contentType: 'application/octet-stream' };

		const result = await service.createReadUrl(request);
		expect(result).toHaveProperty('url');
		expect(result).toHaveProperty('authorizationHeader');
		expect(result).toHaveProperty('headers');
		expect(result.authorizationHeader).toMatch(/^SharedKey /);
	});
});
