import { ServiceBlobStorage } from '@cellix/service-blob-storage';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { uploadMock, deleteBlobMock, listBlobsFlatMock, blobServiceFromConnectionStringMock, generateBlobSasQueryParametersMock, MockStorageSharedKeyCredential } = vi.hoisted(() => {
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

	const MockContainerSASPermissions = {
		parse(value: string) {
			return `container:${value}`;
		},
	};

	return {
		BlobServiceClient: {
			fromConnectionString: blobServiceFromConnectionStringMock,
		},
		BlobSASPermissions: MockBlobSASPermissions,
		ContainerSASPermissions: MockContainerSASPermissions,
		generateBlobSASQueryParameters: generateBlobSasQueryParametersMock,
		StorageSharedKeyCredential: MockStorageSharedKeyCredential,
	};
});

describe('ServiceBlobStorage', () => {
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
	const blobServiceClient = {
		getContainerClient: vi.fn(() => containerClient),
	};

	beforeEach(() => {
		vi.clearAllMocks();
		blobServiceFromConnectionStringMock.mockReturnValue(blobServiceClient);
		generateBlobSasQueryParametersMock.mockReturnValue({
			toString: () => 'blob-sas-token',
		});
		listBlobsFlatMock.mockReturnValue(
			(async function* (): AsyncGenerator<{ name: string }> {
				await Promise.resolve();
				yield { name: 'a.txt' };
				yield { name: 'b.txt' };
			})(),
		);
	});

	it('starts up from the connection string and parses shared-key credentials', async () => {
		const service = new ServiceBlobStorage({ connectionString });

		const started = await service.startUp();

		expect(started).toBe(service);
		expect(blobServiceFromConnectionStringMock).toHaveBeenCalledWith(connectionString);
		expect(service.blobServiceClient).toBe(blobServiceClient);
	});

	it('uploads text with optional metadata and headers', async () => {
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

		expect(blobServiceClient.getContainerClient).toHaveBeenCalledWith('member-assets');
		expect(containerClient.getBlockBlobClient).toHaveBeenCalledWith('avatars/member-1.json');
		expect(uploadMock).toHaveBeenCalledWith('{"hello":"world"}', Buffer.byteLength('{"hello":"world"}'), {
			blobHTTPHeaders: { blobContentType: 'application/json' },
			metadata: { source: 'test' },
			tags: { tenant: 'ocom' },
		});
	});

	it('lists blob names and absolute URLs for a prefix', async () => {
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

	it('creates read and write blob SAS URLs plus a list container SAS URL', async () => {
		const service = new ServiceBlobStorage({ connectionString });
		await service.startUp();

		const expiresOn = new Date('2026-05-14T12:00:00.000Z');
		const readUrl = await service.createBlobReadSasUrl({
			containerName: 'member-assets',
			blobName: 'avatars/member-1.png',
			expiresOn,
		});
		const writeUrl = await service.createBlobWriteSasUrl({
			containerName: 'member-assets',
			blobName: 'avatars/member-1.png',
			expiresOn,
		});
		const listUrl = await service.createContainerListSasUrl({
			containerName: 'member-assets',
			expiresOn,
		});

		expect(generateBlobSasQueryParametersMock).toHaveBeenNthCalledWith(
			1,
			{
				containerName: 'member-assets',
				blobName: 'avatars/member-1.png',
				expiresOn,
				permissions: 'blob:r',
			},
			new MockStorageSharedKeyCredential('test-account', 'test-key'),
		);
		expect(generateBlobSasQueryParametersMock).toHaveBeenNthCalledWith(
			2,
			{
				containerName: 'member-assets',
				blobName: 'avatars/member-1.png',
				expiresOn,
				permissions: 'blob:cw',
			},
			new MockStorageSharedKeyCredential('test-account', 'test-key'),
		);
		expect(generateBlobSasQueryParametersMock).toHaveBeenNthCalledWith(
			3,
			{
				containerName: 'member-assets',
				expiresOn,
				permissions: 'container:rl',
			},
			new MockStorageSharedKeyCredential('test-account', 'test-key'),
		);
		expect(readUrl).toBe('https://blob.example.test/container/blob.txt?blob-sas-token');
		expect(writeUrl).toBe('https://blob.example.test/container/blob.txt?blob-sas-token');
		expect(listUrl).toBe('https://blob.example.test/container?blob-sas-token');
	});

	it('guards against invalid lifecycle access', async () => {
		const service = new ServiceBlobStorage({ connectionString });

		expect(() => service.blobServiceClient).toThrow('ServiceBlobStorage is not started - cannot access blobServiceClient');
		await expect(service.shutDown()).rejects.toThrow('ServiceBlobStorage is not started - shutdown cannot proceed');
	});
});
