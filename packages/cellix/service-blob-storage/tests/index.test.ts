import { createHash } from 'node:crypto';
import { ServiceBlobStorage, ServiceClientBlobStorage } from '@cellix/service-blob-storage';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
	uploadMock,
	deleteBlobMock,
	listBlobsFlatMock,
	listContainersMock,
	listBlobsByHierarchyMock,
	findBlobsByTagsMock,
	getPropertiesMock,
	getTagsMock,
	downloadMock,
	blobServiceFromConnectionStringMock,
	blobServiceConstructorMock,
	generateBlobSasQueryParametersMock,
	defaultAzureCredentialMock,
	MockStorageSharedKeyCredential,
} = vi.hoisted(() => {
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
		listContainersMock: vi.fn(),
		listBlobsByHierarchyMock: vi.fn(),
		findBlobsByTagsMock: vi.fn(),
		getPropertiesMock: vi.fn(),
		getTagsMock: vi.fn(),
		downloadMock: vi.fn(),
		blobServiceFromConnectionStringMock: vi.fn(),
		blobServiceConstructorMock: vi.fn(),
		generateBlobSasQueryParametersMock: vi.fn(),
		defaultAzureCredentialMock: vi.fn(),
		MockStorageSharedKeyCredential: HoistedStorageSharedKeyCredential,
	};
});

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
	const blobClient = {
		url: 'https://blob.example.test/container/blob.txt',
		getProperties: getPropertiesMock,
		getTags: getTagsMock,
		download: downloadMock,
	};
	const containerClient = {
		url: 'https://blob.example.test/container',
		getBlockBlobClient: vi.fn(() => blockBlobClient),
		getBlobClient: vi.fn(() => blobClient),
		deleteBlob: deleteBlobMock,
		listBlobsFlat: listBlobsFlatMock,
		listBlobsByHierarchy: listBlobsByHierarchyMock,
	};
	const blobServiceClient = {
		url: 'https://test-account.blob.core.windows.net',
		getContainerClient: vi.fn(() => containerClient),
		listContainers: listContainersMock,
		findBlobsByTags: findBlobsByTagsMock,
	};

	beforeEach(() => {
		vi.clearAllMocks();
		blobServiceFromConnectionStringMock.mockReturnValue({
			url: 'https://127.0.0.1:10000/devstoreaccount1',
			getContainerClient: vi.fn(() => containerClient),
		});
		blobServiceConstructorMock.mockImplementation((url: string) => ({
			...blobServiceClient,
			url,
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
		listContainersMock.mockReturnValue(
			(async function* (): AsyncGenerator<{ name: string }> {
				await Promise.resolve();
				yield { name: 'private' };
				yield { name: 'member-assets' };
			})(),
		);
		listBlobsByHierarchyMock.mockReturnValue({
			byPage: vi.fn(() => ({
				next: vi.fn(async () => {
					await Promise.resolve();
					return {
						done: false,
						value: {
							continuationToken: 'next-page',
							segment: {
								blobPrefixes: [{ name: 'avatars/' }],
								blobItems: [
									{
										name: 'readme.txt',
										properties: {
											contentType: 'text/plain',
											contentLength: 12,
											lastModified: new Date('2026-05-14T12:00:00.000Z'),
										},
										metadata: { source: 'test' },
										tags: { env: 'dev' },
									},
								],
							},
						},
					};
				}),
			})),
		});
		findBlobsByTagsMock.mockReturnValue(
			(async function* (): AsyncGenerator<{ name: string }> {
				await Promise.resolve();
				yield { name: 'avatars/member-1.png' };
				yield { name: 'readme.txt' };
			})(),
		);
		getPropertiesMock.mockResolvedValue({
			contentType: 'text/plain',
			contentLength: 5,
			lastModified: new Date('2026-05-14T12:00:00.000Z'),
			metadata: { source: 'test' },
		});
		getTagsMock.mockResolvedValue({ tags: { env: 'dev' } });
		downloadMock.mockResolvedValue({
			contentType: 'text/plain',
			lastModified: new Date('2026-05-14T12:00:00.000Z'),
			readableStreamBody: (async function* (): AsyncGenerator<Buffer> {
				await Promise.resolve();
				yield Buffer.from('hello');
			})(),
		});
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

		it('lists containers sorted alphabetically', async () => {
			const service = new ServiceBlobStorage({ accountName });
			await service.startUp();

			const result = await service.listContainers();

			expect(listContainersMock).toHaveBeenCalled();
			expect(result).toEqual([{ name: 'member-assets' }, { name: 'private' }]);
		});

		it('lists one hierarchy level with folders, blob properties, and a continuation token', async () => {
			const service = new ServiceBlobStorage({ accountName });
			await service.startUp();

			const result = await service.listBlobHierarchy({
				containerName: 'member-assets',
				prefix: '',
				pageSize: 20,
			});

			expect(listBlobsByHierarchyMock).toHaveBeenCalledWith('/', {
				prefix: undefined,
				includeMetadata: true,
				includeTags: true,
			});
			expect(result.continuationToken).toBe('next-page');
			expect(result.folders).toEqual([{ name: 'avatars', prefix: 'avatars/' }]);
			expect(result.blobs).toEqual([
				{
					name: 'readme.txt',
					blobName: 'readme.txt',
					url: 'https://blob.example.test/container/blob.txt',
					contentType: 'text/plain',
					contentLength: 12,
					lastModified: new Date('2026-05-14T12:00:00.000Z'),
					metadata: { source: 'test' },
					tags: { env: 'dev' },
				},
			]);
		});

		it('filters hierarchy results with blob index tags', async () => {
			const service = new ServiceBlobStorage({ accountName });
			await service.startUp();

			const result = await service.listBlobHierarchy({
				containerName: 'member-assets',
				prefix: '',
				tagKey: 'env',
				tagValue: 'dev',
				pageSize: 10,
			});

			expect(findBlobsByTagsMock).toHaveBeenCalledWith(`@container='member-assets' AND "env"='dev'`);
			expect(result.folders).toEqual([{ name: 'avatars', prefix: 'avatars/' }]);
			expect(result.blobs.map((blob) => blob.blobName)).toEqual(['readme.txt']);
			expect(result.continuationToken).toBeUndefined();
		});

		it('downloads blob content with metadata and tags when under the size limit', async () => {
			const service = new ServiceBlobStorage({ accountName });
			await service.startUp();

			const result = await service.downloadBlob({
				containerName: 'member-assets',
				blobName: 'readme.txt',
			});

			expect(containerClient.getBlobClient).toHaveBeenCalledWith('readme.txt');
			expect(result).toEqual({
				contentType: 'text/plain',
				contentLength: 5,
				lastModified: new Date('2026-05-14T12:00:00.000Z'),
				metadata: { source: 'test' },
				tags: { env: 'dev' },
				content: new Uint8Array(Buffer.from('hello')),
				encoding: 'utf-8',
				url: 'https://blob.example.test/container/blob.txt',
			});
		});

		it('rejects downloads that exceed the in-memory size limit', async () => {
			getPropertiesMock.mockResolvedValueOnce({
				contentType: 'application/octet-stream',
				contentLength: 6 * 1024 * 1024,
				lastModified: new Date('2026-05-14T12:00:00.000Z'),
				metadata: {},
			});
			const service = new ServiceBlobStorage({ accountName });
			await service.startUp();

			await expect(
				service.downloadBlob({
					containerName: 'member-assets',
					blobName: 'large.bin',
				}),
			).rejects.toThrow(/maximum download size/);
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
