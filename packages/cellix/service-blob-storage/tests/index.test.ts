import { createHash } from 'node:crypto';
import { ServiceBlobStorage, ServiceClientBlobStorage } from '@cellix/service-blob-storage';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { uploadMock, deleteBlobMock, listBlobsFlatMock, blobServiceFromConnectionStringMock, blobServiceConstructorMock, generateBlobSasQueryParametersMock, defaultAzureCredentialMock, MockStorageSharedKeyCredential } = vi.hoisted(
	() => {
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
			defaultAzureCredentialMock: vi.fn(),
			MockStorageSharedKeyCredential: HoistedStorageSharedKeyCredential,
		};
	},
);

vi.mock('@azure/identity', () => ({
	DefaultAzureCredential: class MockDefaultAzureCredential {
		constructor() {
			defaultAzureCredentialMock();
		}
	},
}));

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
	const accountName = 'test-account';
	const accountKey = createHash('sha256').update('cellix-azurite-test-account-key').digest('base64');
	const signingConnectionString = `DefaultEndpointsProtocol=https;AccountName=${accountName};AccountKey=${accountKey};EndpointSuffix=core.windows.net`;
	const localSigningConnectionString = 'DefaultEndpointsProtocol=https;AccountName=devstoreaccount1;AccountKey=test;BlobEndpoint=https://127.0.0.1:10000/devstoreaccount1;';
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
			url: 'https://127.0.0.1:10000/devstoreaccount1',
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

	describe('ServiceBlobStorage', () => {
		it('starts managed-identity blob access with the account blob endpoint', async () => {
			const service = new ServiceBlobStorage({ accountName: 'devstoreaccount1' });

			const started = await service.startUp();

			expect(started).toBe(service);
			expect(defaultAzureCredentialMock).toHaveBeenCalledTimes(1);
			expect(blobServiceConstructorMock).toHaveBeenCalledWith('https://devstoreaccount1.blob.core.windows.net');
		});

		it('uploads text with optional metadata, tags, and headers', async () => {
			const service = new ServiceBlobStorage({ accountName });
			await service.startUp();

			await service.uploadText({
				containerName: 'member-assets',
				blobName: 'avatars/member-1.json',
				text: '{"hello":"world"}',
				httpHeaders: { blobContentType: 'application/json' },
				metadata: { source: 'test' },
				tags: { tenant: 'ocom' },
			});

			expect(containerClient.getBlockBlobClient).toHaveBeenCalledWith('avatars/member-1.json');
			expect(uploadMock).toHaveBeenCalledWith('{"hello":"world"}', Buffer.byteLength('{"hello":"world"}'), {
				blobHTTPHeaders: { blobContentType: 'application/json' },
				metadata: { source: 'test' },
				tags: { tenant: 'ocom' },
			});
		});

		it('lists blob names and absolute URLs for an optional prefix', async () => {
			const service = new ServiceBlobStorage({ accountName });
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
			const service = new ServiceBlobStorage({ accountName });
			await service.startUp();

			await service.deleteBlob({
				containerName: 'member-assets',
				blobName: 'avatars/member-1.json',
			});

			expect(deleteBlobMock).toHaveBeenCalledWith('avatars/member-1.json');
		});

		it('supports idempotent shutdown before startup', async () => {
			const service = new ServiceBlobStorage({ accountName });

			await expect(service.shutDown()).resolves.toBeUndefined();
		});
	});

	describe('ServiceClientBlobStorage', () => {
		it('requires the client service for shared-key signing behavior', async () => {
			const service = new ServiceClientBlobStorage({
				accountName,
				signingConnectionString,
			});
			await service.startUp();

			const expiresOn = new Date('2026-05-14T12:00:00.000Z');
			const token = await service.generateReadSasToken({
				containerName: 'member-assets',
				blobName: 'avatars/member-1.png',
				expiresOn,
			});
			const writeAuth = await service.createBlobWriteAuthorizationHeader({
				containerName: 'member-assets',
				blobName: 'avatars/member-1.png',
				contentLength: 1024,
				contentType: 'image/png',
				metadata: { source: 'test' },
			});
			const readAuth = await service.createBlobReadAuthorizationHeader({
				containerName: 'member-assets',
				blobName: 'avatars/member-1.png',
				contentLength: 1024,
				contentType: 'image/png',
			});

			expect(blobServiceConstructorMock).toHaveBeenCalledWith('https://test-account.blob.core.windows.net');
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
			expect(writeAuth.url).toContain('/member-assets/avatars/member-1.png');
			expect(writeAuth.authorizationHeader).toContain('SharedKey');
			expect(writeAuth.headers['Content-Type']).toBe('image/png');
			expect(writeAuth.headers['Content-Length']).toBe('1024');
			expect(writeAuth.headers['x-ms-meta-source']).toBe('test');
			expect(readAuth.url).toContain('/member-assets/avatars/member-1.png');
			expect(readAuth.authorizationHeader).toContain('SharedKey');
			expect(readAuth.headers['Content-Type']).toBe('image/png');
			expect(readAuth.headers['Content-Length']).toBe('1024');
		});

		it('uses the signing connection string as the blob client source for local emulator endpoints', async () => {
			const service = new ServiceClientBlobStorage({
				accountName: 'devstoreaccount1',
				signingConnectionString: localSigningConnectionString,
			});

			await service.startUp();

			expect(blobServiceFromConnectionStringMock).toHaveBeenCalledWith(localSigningConnectionString);
			expect(defaultAzureCredentialMock).not.toHaveBeenCalled();
		});
	});

	it('rejects invalid public constructor combinations at type level', () => {
		void assertPublicConstructorTypes;
		expect(expectTypeContractIsChecked()).toBe(true);
	});
});

function expectTypeContractIsChecked(): boolean {
	return true;
}

function assertPublicConstructorTypes(): void {
	// @ts-expect-error ServiceBlobStorage no longer accepts signingConnectionString.
	void new ServiceBlobStorage({ accountName: 'test-account', signingConnectionString: 'forbidden' });
	// @ts-expect-error ServiceClientBlobStorage requires signingConnectionString.
	void new ServiceClientBlobStorage({ accountName: 'test-account' });
}
