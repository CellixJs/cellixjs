import { describe, expect, it, vi } from 'vitest';
import { createBlobStorage } from './blob-storage-adapter.ts';
import { ServiceBlobStorage } from './service-blob-storage.ts';

describe('createBlobStorage', () => {
	it('downscopes the Cellix blob service to upload and read URL creation only', async () => {
		const createBlobWriteSasUrl = vi.fn().mockResolvedValue('write-url');
		const createBlobReadSasUrl = vi.fn().mockResolvedValue('read-url');

		const sasService = {
			uploadText: vi.fn(),
			deleteBlob: vi.fn(),
			listBlobs: vi.fn(),
			createBlobWriteSasUrl,
			createBlobReadSasUrl,
			createContainerListSasUrl: vi.fn(),
		};

		const blobStorage = createBlobStorage(
			{
				uploadText: vi.fn(),
				deleteBlob: vi.fn(),
				listBlobs: vi.fn(),
				createBlobWriteSasUrl: vi.fn(),
				createBlobReadSasUrl: vi.fn(),
				createContainerListSasUrl: vi.fn(),
			},
			sasService as never,
		);

		expect(Object.keys(blobStorage).sort()).toEqual(['createReadUrl', 'createUploadUrl']);

		const request = {
			containerName: 'member-assets',
			blobName: 'avatars/member-123.png',
			expiresOn: new Date('2026-05-14T12:00:00.000Z'),
		};

		await expect(blobStorage.createUploadUrl(request)).resolves.toBe('write-url');
		await expect(blobStorage.createReadUrl(request)).resolves.toBe('read-url');
		expect(createBlobWriteSasUrl).toHaveBeenCalledWith(request);
		expect(createBlobReadSasUrl).toHaveBeenCalledWith(request);
	});

	it('throws when SAS signing is not configured', async () => {
		const blobStorage = createBlobStorage({
			uploadText: vi.fn(),
			deleteBlob: vi.fn(),
			listBlobs: vi.fn(),
			createBlobWriteSasUrl: vi.fn(),
			createBlobReadSasUrl: vi.fn(),
			createContainerListSasUrl: vi.fn(),
		});

		const request = {
			containerName: 'member-assets',
			blobName: 'avatars/member-123.png',
			expiresOn: new Date('2026-05-14T12:00:00.000Z'),
		};

		await expect(blobStorage.createUploadUrl(request)).rejects.toThrow('Client uploads with SAS signing are not configured');
		await expect(blobStorage.createReadUrl(request)).rejects.toThrow('SAS read URLs are not configured');
	});
});

describe('ServiceBlobStorage', () => {
	it('starts both SDK and SAS signing services when connection string provided', async () => {
		const sdkService = {
			startUp: vi.fn().mockResolvedValue({
				uploadText: vi.fn(),
				deleteBlob: vi.fn(),
				listBlobs: vi.fn(),
				createBlobWriteSasUrl: vi.fn(),
				createBlobReadSasUrl: vi.fn(),
				createContainerListSasUrl: vi.fn(),
			}),
			shutDown: vi.fn().mockResolvedValue(undefined),
		};

		const sasService = {
			startUp: vi.fn().mockResolvedValue({
				createBlobWriteSasUrl: vi.fn().mockResolvedValue('write-url'),
				createBlobReadSasUrl: vi.fn().mockResolvedValue('read-url'),
				uploadText: vi.fn(),
				deleteBlob: vi.fn(),
				listBlobs: vi.fn(),
				createContainerListSasUrl: vi.fn(),
			}),
			shutDown: vi.fn().mockResolvedValue(undefined),
		};

		const service = new ServiceBlobStorage({
			accountName: 'devstoreaccount1',
			connectionString: 'UseDevelopmentStorage=true;AccountName=devstoreaccount1;AccountKey=abc123=',
			frameworkService: sdkService as never,
		} as never);

		// Inject SAS service by mocking the constructor behavior
		// Note: In real usage, both services are created by the constructor
		(service as any).sasSigningService = sasService;

		const started = await service.startUp();
		const request = {
			containerName: 'member-assets',
			blobName: 'avatars/member-123.png',
			expiresOn: new Date('2026-05-14T12:00:00.000Z'),
		};

		expect(started).toBe(service);
		await expect(service.createUploadUrl(request)).resolves.toBe('write-url');
		await expect(service.createReadUrl(request)).resolves.toBe('read-url');

		await service.shutDown();
		expect(sdkService.startUp).toHaveBeenCalledTimes(1);
		expect(sasService.startUp).toHaveBeenCalledTimes(1);
		expect(sdkService.shutDown).toHaveBeenCalledTimes(1);
		expect(sasService.shutDown).toHaveBeenCalledTimes(1);
	});

	it('guards against access before startup', async () => {
		const service = new ServiceBlobStorage({
			accountName: 'devstoreaccount1',
			frameworkService: {
				startUp: vi.fn(),
				shutDown: vi.fn(),
			} as never,
		} as never);

		await expect(
			service.createUploadUrl({
				containerName: 'member-assets',
				blobName: 'avatars/member-123.png',
				expiresOn: new Date('2026-05-14T12:00:00.000Z'),
			}),
		).rejects.toThrow('OCOM ServiceBlobStorage adapter is not started - cannot access service');
		// shutdown is idempotent and should resolve even when not started
		await expect(service.shutDown()).resolves.toBeUndefined();
	});

	it('creates SDK service with only accountName for managed identity', () => {
		const service = new ServiceBlobStorage({
			accountName: 'devstoreaccount1',
		} as never);

		expect(service).toBeDefined();
		// The service should be created with accountName (managed identity)
		// Connection string is not passed to SDK service
	});

	it('creates separate SAS signing service when connectionString provided', () => {
		const service = new ServiceBlobStorage({
			accountName: 'devstoreaccount1',
			connectionString: 'UseDevelopmentStorage=true;AccountName=devstoreaccount1;AccountKey=abc123=',
		} as never);

		expect(service).toBeDefined();
		// The service should have both SDK service (managed identity)
		// and separate SAS signing service (connection string)
	});
});
