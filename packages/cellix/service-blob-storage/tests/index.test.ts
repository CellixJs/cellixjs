import { ServiceBlobStorage } from '@cellix/service-blob-storage';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { uploadMock, deleteBlobMock, listBlobsFlatMock, blobServiceFromConnectionStringMock, blobServiceConstructorMock, generateBlobSasQueryParametersMock, MockStorageSharedKeyCredential } = vi.hoisted(() => {
	class HoistedStorageSharedKeyCredential {
		public readonly accountName: string;
		public readonly accountKey: string;

		constructor(accountName: string, accountKey: string) {
			this.accountName = accountName;
			this.accountKey = accountKey;
		}
	}

	return {
		uploadMock: vi.fn(),
		deleteBlobMock: vi.fn(),
		listBlobsFlatMock: vi.fn(),
		blobServiceFromConnectionStringMock: vi.fn(),
		blobServiceConstructorMock: vi.fn(),
		generateBlobSasQueryParametersMock: vi.fn(),
		MockStorageSharedKeyCredential: HoistedStorageSharedKeyCredential,
	};
});

vi.mock('@azure/storage-blob', () => {
	const MockBlobSASPermissions = {
		parse(value: string) {
			return `blob:${value}`;
		},
	};

	class MockBlobServiceClient {
		public readonly url: string;

		constructor(url: string) {
			this.url = url;
			Object.assign(this, blobServiceConstructorMock(url));
		}

		public getContainerClient = vi.fn();

		static fromConnectionString(connectionString: string) {
			return blobServiceFromConnectionStringMock(connectionString);
		}
	}

	return {
		BlobServiceClient: MockBlobServiceClient,
		BlobSASPermissions: MockBlobSASPermissions,
		generateBlobSASQueryParameters: generateBlobSasQueryParametersMock,
		StorageSharedKeyCredential: MockStorageSharedKeyCredential,
	};
});

describe('@cellix/service-blob-storage public contract', () => {
	const connectionString = 'DefaultEndpointsProtocol=https;AccountName=test-account;AccountKey=test-key;EndpointSuffix=core.windows.net';
	const blockBlobClient = {
		url: 'https://blob.example.test/container/blob.txt',
		upload: uploadMock,
	};
	const containerClient = {
		url: 'https://blob.example.test/container',
		getBlockBlobClient: vi.fn(() => blockBlobClient),
		deleteBlob: deleteBlobMock,
		listBlobsFlat: listBlobsFlatMock,
	};

	beforeEach(() => {
		vi.clearAllMocks();
		blobServiceFromConnectionStringMock.mockReturnValue({
			url: 'http://127.0.0.1:10000/devstoreaccount1',
			getContainerClient: vi.fn(() => containerClient),
		});
		blobServiceConstructorMock.mockImplementation((url: string) => ({
			url,
			getContainerClient: vi.fn(() => containerClient),
		}));
		generateBlobSasQueryParametersMock.mockReturnValue({
			toString: () => 'sig=token-123&se=2026-05-14T12%3A00%3A00Z&sr=b&sp=r',
		});
		listBlobsFlatMock.mockReturnValue(
			(async function* (): AsyncGenerator<{ name: string }> {
				await Promise.resolve();
				yield { name: 'a.txt' };
				yield { name: 'b.txt' };
			})(),
		);
	});

	it('starts up from a connection string and exposes the started client', async () => {
		const service = new ServiceBlobStorage({ connectionString });

		const started = await service.startUp();

		expect(started).toBe(service);
		expect(blobServiceFromConnectionStringMock).toHaveBeenCalledWith(connectionString);
		expect(service.blobServiceClient.url).toBe('http://127.0.0.1:10000/devstoreaccount1');
	});

	it('supports managed identity for server-side blob access', async () => {
		const service = new ServiceBlobStorage({ accountName: 'devstoreaccount1' });

		await service.startUp();

		expect(service.blobServiceClient.url).toBe('https://devstoreaccount1.blob.core.windows.net');
	});

	it('uploads text with optional metadata, tags, and headers', async () => {
		const service = new ServiceBlobStorage({ connectionString });
		await service.startUp();

		await service.uploadText({
			containerName: 'member-assets',
			blobName: 'avatars/member-1.json',
			text: '{"hello":"world"}',
			httpHeaders: { blobContentType: 'application/json' },
			metadata: { source: 'test' },
			tags: { tenant: 'ocom' },
		});

		expect(service.blobServiceClient.getContainerClient).toHaveBeenCalledWith('member-assets');
		expect(containerClient.getBlockBlobClient).toHaveBeenCalledWith('avatars/member-1.json');
		expect(uploadMock).toHaveBeenCalledWith('{"hello":"world"}', Buffer.byteLength('{"hello":"world"}'), {
			blobHTTPHeaders: { blobContentType: 'application/json' },
			metadata: { source: 'test' },
			tags: { tenant: 'ocom' },
		});
	});

	it('lists blob names and absolute URLs for an optional prefix', async () => {
		const service = new ServiceBlobStorage({ connectionString });
		await service.startUp();

		const result = await service.listBlobs({
			containerName: 'member-assets',
			prefix: 'avatars/',
		});

		expect(listBlobsFlatMock).toHaveBeenCalledWith({ prefix: 'avatars/' });
		expect(result).toEqual([
			{
				name: 'a.txt',
				url: 'https://blob.example.test/container/blob.txt',
			},
			{
				name: 'b.txt',
				url: 'https://blob.example.test/container/blob.txt',
			},
		]);
	});

	it('deletes a blob by container and name', async () => {
		const service = new ServiceBlobStorage({ connectionString });
		await service.startUp();

		await service.deleteBlob({
			containerName: 'member-assets',
			blobName: 'avatars/member-1.json',
		});

		expect(deleteBlobMock).toHaveBeenCalledWith('avatars/member-1.json');
	});

	it('generates read SAS tokens for blob access', async () => {
		const service = new ServiceBlobStorage({ connectionString });
		await service.startUp();

		const expiresOn = new Date('2026-05-14T12:00:00.000Z');
		const token = await service.generateReadSasToken({
			containerName: 'member-assets',
			blobName: 'avatars/member-1.png',
			expiresOn,
		});

		expect(generateBlobSasQueryParametersMock).toHaveBeenCalledWith(
			{
				containerName: 'member-assets',
				blobName: 'avatars/member-1.png',
				expiresOn,
				permissions: 'blob:r',
			},
			expect.any(MockStorageSharedKeyCredential),
		);
		expect(token).toContain('sig=token-123');
	});

	it('creates blob write authorization headers in shared-key mode', async () => {
		const service = new ServiceBlobStorage({ connectionString });
		await service.startUp();

		const result = await service.createBlobWriteAuthorizationHeader({
			containerName: 'member-assets',
			blobName: 'avatars/member-1.png',
			contentLength: 1024,
			contentType: 'image/png',
			metadata: { source: 'test' },
		});

		expect(result.url).toContain('/member-assets/avatars/member-1.png');
		expect(result.authorizationHeader).toContain('SharedKey');
		expect(result.headers['Content-Type']).toBe('image/png');
		expect(result.headers['Content-Length']).toBe('1024');
		expect(result.headers['x-ms-meta-source']).toBe('test');
	});

	it('creates blob read authorization headers in shared-key mode', async () => {
		const service = new ServiceBlobStorage({ connectionString });
		await service.startUp();

		const result = await service.createBlobReadAuthorizationHeader({
			containerName: 'member-assets',
			blobName: 'avatars/member-1.png',
			contentLength: 1024,
			contentType: 'image/png',
		});

		expect(result.url).toContain('/member-assets/avatars/member-1.png');
		expect(result.authorizationHeader).toContain('SharedKey');
		expect(result.headers['Content-Type']).toBe('image/png');
		expect(result.headers['Content-Length']).toBe('1024');
	});

	it('enables shared-key signing as an explicit opt-in capability on a managed-identity blob client', async () => {
		const service = new ServiceBlobStorage({
			accountName: 'devstoreaccount1',
			signingConnectionString: connectionString,
		});
		await service.startUp();

		const result = await service.createBlobWriteAuthorizationHeader({
			containerName: 'member-assets',
			blobName: 'avatars/member-1.png',
			contentLength: 1024,
			contentType: 'image/png',
		});

		expect(service.blobServiceClient.url).toBe('https://devstoreaccount1.blob.core.windows.net');
		expect(result.url).toContain('/member-assets/avatars/member-1.png');
		expect(result.authorizationHeader).toContain('SharedKey');
	});

	it('rejects shared-key-only operations when signing capability is not configured', async () => {
		const service = new ServiceBlobStorage({ accountName: 'devstoreaccount1' });
		await service.startUp();

		await expect(
			service.createBlobWriteAuthorizationHeader({
				containerName: 'member-assets',
				blobName: 'avatars/member-1.png',
				contentLength: 1024,
				contentType: 'image/png',
			}),
		).rejects.toThrow('Shared-key signing is not configured; provide signingConnectionString or use connectionString-based blob client configuration');

		await expect(
			service.createBlobReadAuthorizationHeader({
				containerName: 'member-assets',
				blobName: 'avatars/member-1.png',
				contentLength: 1024,
				contentType: 'image/png',
			}),
		).rejects.toThrow('Shared-key signing is not configured; provide signingConnectionString or use connectionString-based blob client configuration');

		await expect(
			service.generateReadSasToken({
				containerName: 'member-assets',
				blobName: 'avatars/member-1.png',
				expiresOn: new Date('2026-05-14T12:00:00.000Z'),
			}),
		).rejects.toThrow('Shared-key signing is not configured; provide signingConnectionString or use connectionString-based blob client configuration');
	});

	it('guards against invalid lifecycle access and supports idempotent shutdown', async () => {
		const service = new ServiceBlobStorage({ connectionString });

		expect(() => service.blobServiceClient).toThrow('ServiceBlobStorage is not started - cannot access blobServiceClient');
		await expect(service.shutDown()).resolves.toBeUndefined();
	});
});
