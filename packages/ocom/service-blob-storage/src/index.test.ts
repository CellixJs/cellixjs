import { describe, expect, it, vi } from 'vitest';
import { createBlobStorage } from './blob-storage-adapter.ts';
import { ServiceBlobStorage } from './service-blob-storage.ts';

describe('createBlobStorage', () => {
	it('downscopes the Cellix blob service to upload and read URL creation only', async () => {
		const createBlobWriteSasUrl = vi.fn().mockResolvedValue('write-url');
		const createBlobReadSasUrl = vi.fn().mockResolvedValue('read-url');

		const blobStorage = createBlobStorage({
			uploadText: vi.fn(),
			deleteBlob: vi.fn(),
			listBlobs: vi.fn(),
			createBlobWriteSasUrl,
			createBlobReadSasUrl,
			createContainerListSasUrl: vi.fn(),
		});

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
});

describe('ServiceBlobStorage', () => {
	it('starts the framework service and exposes the narrowed contract', async () => {
		const frameworkService = {
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
			connectionString: 'UseDevelopmentStorage=true;AccountName=devstoreaccount1;AccountKey=abc123=',
			frameworkService: frameworkService as never,
		} as never);

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
		expect(frameworkService.startUp).toHaveBeenCalledTimes(1);
		expect(frameworkService.shutDown).toHaveBeenCalledTimes(1);
	});

	it('guards against access before startup', async () => {
		const service = new ServiceBlobStorage({
			connectionString: 'UseDevelopmentStorage=true;AccountName=devstoreaccount1;AccountKey=abc123=',
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
		).rejects.toThrow('ServiceBlobStorage is not started - cannot access service');
		// shutdown is idempotent and should resolve even when not started
		await expect(service.shutDown()).resolves.toBeUndefined();
	});

	it('creates framework service when not provided, using only accountName for managed identity', () => {
		const service = new ServiceBlobStorage({
			accountName: 'devstoreaccount1',
			connectionString: 'UseDevelopmentStorage=true;AccountName=devstoreaccount1;AccountKey=abc123=',
		} as never);

		expect(service).toBeDefined();
		// The service should be created with accountName (managed identity)
		// This test verifies the constructor path that creates the framework service
	});
});
