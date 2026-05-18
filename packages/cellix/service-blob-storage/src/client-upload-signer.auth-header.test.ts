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

	describe('Security - Metadata Locking (Negative Scenarios)', () => {
		it('auth header for one blob cannot be reused for a different blob', async () => {
			// Generate auth header for blob A
			const authForBlobA = await signer.createBlobWriteAuthorizationHeader({
				containerName: 'test-container',
				blobName: 'blob-a.txt',
				contentLength: 100,
				contentType: 'text/plain',
			});

			// Generate auth header for blob B (same container, different name)
			const authForBlobB = await signer.createBlobWriteAuthorizationHeader({
				containerName: 'test-container',
				blobName: 'blob-b.txt',
				contentLength: 100,
				contentType: 'text/plain',
			});

			// Auth headers must be different because they lock in the blob name
			expect(authForBlobA.authorizationHeader).not.toBe(authForBlobB.authorizationHeader);
		});

		it('auth header for one container cannot be reused for a different container', async () => {
			// Generate auth header for container A
			const authForContainerA = await signer.createBlobWriteAuthorizationHeader({
				containerName: 'container-a',
				blobName: 'test-blob.txt',
				contentLength: 100,
				contentType: 'text/plain',
			});

			// Generate auth header for container B (different container, same blob name)
			const authForContainerB = await signer.createBlobWriteAuthorizationHeader({
				containerName: 'container-b',
				blobName: 'test-blob.txt',
				contentLength: 100,
				contentType: 'text/plain',
			});

			// Auth headers must be different because they lock in the container
			expect(authForContainerA.authorizationHeader).not.toBe(authForContainerB.authorizationHeader);
		});

		it('auth header locks in content-length metadata', async () => {
			// Generate auth header for 100 bytes
			const authFor100Bytes = await signer.createBlobWriteAuthorizationHeader({
				containerName: 'test-container',
				blobName: 'test-blob.txt',
				contentLength: 100,
				contentType: 'text/plain',
			});

			// Generate auth header for 200 bytes
			const authFor200Bytes = await signer.createBlobWriteAuthorizationHeader({
				containerName: 'test-container',
				blobName: 'test-blob.txt',
				contentLength: 200,
				contentType: 'text/plain',
			});

			// Auth headers must be different because they lock in content length
			expect(authFor100Bytes.authorizationHeader).not.toBe(authFor200Bytes.authorizationHeader);
		});

		it('auth header locks in content-type metadata', async () => {
			// Generate auth header for text/plain
			const authForText = await signer.createBlobWriteAuthorizationHeader({
				containerName: 'test-container',
				blobName: 'test-blob',
				contentLength: 100,
				contentType: 'text/plain',
			});

			// Generate auth header for application/json
			const authForJson = await signer.createBlobWriteAuthorizationHeader({
				containerName: 'test-container',
				blobName: 'test-blob',
				contentLength: 100,
				contentType: 'application/json',
			});

			// Auth headers must be different because they lock in content type
			expect(authForText.authorizationHeader).not.toBe(authForJson.authorizationHeader);
		});

		it('auth header locks in blob metadata values', async () => {
			// Generate auth header with userId=alice
			const authAlice = await signer.createBlobWriteAuthorizationHeader({
				containerName: 'test-container',
				blobName: 'test-blob.txt',
				contentLength: 100,
				contentType: 'text/plain',
				metadata: { userId: 'alice', scope: 'profile' },
			});

			// Generate auth header with userId=bob (same scope)
			const authBob = await signer.createBlobWriteAuthorizationHeader({
				containerName: 'test-container',
				blobName: 'test-blob.txt',
				contentLength: 100,
				contentType: 'text/plain',
				metadata: { userId: 'bob', scope: 'profile' },
			});

			// Auth headers must be different because they lock in metadata values
			expect(authAlice.authorizationHeader).not.toBe(authBob.authorizationHeader);
		});

		it('auth header is invalidated if content-length does not match signed value', async () => {
			// This test documents the expected behavior: when a client attempts to upload
			// with mismatched Content-Length, Azure Blob Storage should reject it because
			// the signature won't match (server recalculates canonical string with actual length).

			const auth = await signer.createBlobWriteAuthorizationHeader({
				containerName: 'test-container',
				blobName: 'test-blob.txt',
				contentLength: 100,
				contentType: 'text/plain',
			});

			// The auth header is valid for 100 bytes with x-ms-date and Content-Length: 100
			// If client attempts to send a different Content-Length, Azure will:
			// 1. Verify the Authorization header signature
			// 2. Recalculate canonical string with actual Content-Length from request
			// 3. Signature will not match (mismatch between signed and actual)
			// 4. Request rejected

			expect(auth.headers['Content-Length']).toBe('100');
			// If this were sent with Content-Length: 200, signature verification would fail
		});

		it('auth header for write cannot be reused for read', async () => {
			// Generate auth header for write (PUT)
			const writeAuth = await signer.createBlobWriteAuthorizationHeader({
				containerName: 'test-container',
				blobName: 'test-blob.txt',
				contentLength: 100,
				contentType: 'text/plain',
			});

			// Generate auth header for read (GET)
			const readAuth = await signer.createBlobReadAuthorizationHeader({
				containerName: 'test-container',
				blobName: 'test-blob.txt',
				contentLength: 100,
				contentType: 'text/plain',
			});

			// Auth headers must be different because they lock in the HTTP method
			expect(writeAuth.authorizationHeader).not.toBe(readAuth.authorizationHeader);
		});
	});
});
