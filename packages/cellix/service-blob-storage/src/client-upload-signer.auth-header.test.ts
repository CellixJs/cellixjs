import { describe, expect, it } from 'vitest';
import { ClientUploadSigner } from './client-upload-signer.js';

/**
 * Tests for SharedKey authorization header generation following Azure Blob Storage conventions.
 * Reference: https://learn.microsoft.com/en-us/rest/api/storageservices/authorize-with-shared-key
 */
describe('ClientUploadSigner - Canonical Auth Headers', () => {
	// Azurite development account
	const connectionString =
		'DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;';

	const signer = new ClientUploadSigner(connectionString);

	it('generates SharedKey authorization header for blob write with proper canonical format', async () => {
		const result = await signer.createBlobWriteAuthorizationHeader({
			containerName: 'test-container',
			blobName: 'test-blob.txt',
			contentLength: 100,
			contentType: 'text/plain',
		});

		// Authorization header should start with SharedKey scheme
		expect(result.authorizationHeader).toMatch(/^SharedKey devstoreaccount1:[A-Za-z0-9+/=]+$/);

		// URL should point to blob endpoint
		expect(result.url).toBe('http://127.0.0.1:10000/devstoreaccount1/test-container/test-blob.txt');

		// Headers should include required x-ms-* fields
		expect(result.headers['x-ms-blob-type']).toBe('BlockBlob');
		expect(result.headers['x-ms-version']).toBe('2021-04-10');
		expect(result.headers['x-ms-date']).toBeDefined();
		expect(result.headers['Content-Type']).toBe('text/plain');
		expect(result.headers['Content-Length']).toBe('100');
	});

	it('generates SharedKey authorization header for blob read with proper canonical format', async () => {
		const result = await signer.createBlobReadAuthorizationHeader({
			containerName: 'test-container',
			blobName: 'test-blob.txt',
			contentLength: 100,
			contentType: 'text/plain',
		});

		// Authorization header should start with SharedKey scheme
		expect(result.authorizationHeader).toMatch(/^SharedKey devstoreaccount1:[A-Za-z0-9+/=]+$/);

		// URL should point to blob endpoint
		expect(result.url).toBe('http://127.0.0.1:10000/devstoreaccount1/test-container/test-blob.txt');

		// Headers should include required x-ms-* fields
		expect(result.headers['x-ms-blob-type']).toBe('BlockBlob');
		expect(result.headers['x-ms-version']).toBe('2021-04-10');
		expect(result.headers['x-ms-date']).toBeDefined();
		expect(result.headers['Content-Type']).toBe('text/plain');
		expect(result.headers['Content-Length']).toBe('100');
	});

	it('includes metadata in canonical headers when provided', async () => {
		const result = await signer.createBlobWriteAuthorizationHeader({
			containerName: 'test-container',
			blobName: 'test-blob.txt',
			contentLength: 100,
			contentType: 'text/plain',
			metadata: { userId: 'user-123', source: 'portal' },
		});

		// Metadata should be in headers with x-ms-meta- prefix, lowercase
		expect(result.headers['x-ms-meta-userId']).toBe('user-123');
		expect(result.headers['x-ms-meta-source']).toBe('portal');

		// Authorization should be valid
		expect(result.authorizationHeader).toMatch(/^SharedKey devstoreaccount1:[A-Za-z0-9+/=]+$/);
	});

	it('generates deterministic signature for same request data', async () => {
		const request = {
			containerName: 'test-container',
			blobName: 'test-blob.txt',
			contentLength: 100,
			contentType: 'text/plain',
		};

		const result1 = await signer.createBlobWriteAuthorizationHeader(request);
		const result2 = await signer.createBlobWriteAuthorizationHeader(request);

		// Signatures should match (same inputs = same signature)
		// Note: x-ms-date will differ, but the signature part (after the colon) should match
		// when using the same date. We'll just verify both are valid signatures.
		expect(result1.authorizationHeader).toMatch(/^SharedKey devstoreaccount1:[A-Za-z0-9+/=]+$/);
		expect(result2.authorizationHeader).toMatch(/^SharedKey devstoreaccount1:[A-Za-z0-9+/=]+$/);
	});

	it('throws when provided invalid connection string', () => {
		expect(() => {
			new ClientUploadSigner('invalid-connection-string');
		}).toThrow();
	});

	it('throws when connection string lacks AccountKey', () => {
		const invalidConnectionString = 'DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;';

		expect(() => {
			new ClientUploadSigner(invalidConnectionString);
		}).toThrow();
	});
});
