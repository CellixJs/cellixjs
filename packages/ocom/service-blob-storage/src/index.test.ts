import { describe, expect, it, vi } from 'vitest';
import { ServiceBlobStorage } from './service-blob-storage.ts';

describe('ServiceBlobStorage', () => {
	it('exposes all blob operations from the SDK service', async () => {
		const listBlobs = vi.fn().mockResolvedValue([{ name: 'file1.txt' }, { name: 'file2.txt' }]);
		const uploadText = vi.fn().mockResolvedValue(undefined);
		const deleteBlob = vi.fn().mockResolvedValue(undefined);

		const sdkService = {
			startUp: vi.fn().mockResolvedValue(undefined),
			shutDown: vi.fn().mockResolvedValue(undefined),
			listBlobs,
			uploadText,
			deleteBlob,
			createBlobWriteSasUrl: vi.fn(),
			createBlobReadSasUrl: vi.fn(),
			createContainerListSasUrl: vi.fn(),
		};

		const service = new ServiceBlobStorage({
			sdkService: sdkService as never,
		});

		await expect(service.listBlobs('my-container')).resolves.toEqual(['file1.txt', 'file2.txt']);
		expect(listBlobs).toHaveBeenCalledWith({ containerName: 'my-container' });

		await expect(service.uploadText('my-container', 'file.txt', 'content')).resolves.toBeUndefined();
		expect(uploadText).toHaveBeenCalledWith({ containerName: 'my-container', blobName: 'file.txt', text: 'content' });

		await expect(service.deleteBlob('my-container', 'file.txt')).resolves.toBeUndefined();
		expect(deleteBlob).toHaveBeenCalledWith({ containerName: 'my-container', blobName: 'file.txt' });
	});

	it('delegates SAS URL generation to the SAS signing service', async () => {
		const createBlobWriteSasUrl = vi.fn().mockResolvedValue('https://...write-sas');
		const createBlobReadSasUrl = vi.fn().mockResolvedValue('https://...read-sas');

		const sdkService = {
			startUp: vi.fn(),
			shutDown: vi.fn(),
			listBlobs: vi.fn(),
			uploadText: vi.fn(),
			deleteBlob: vi.fn(),
			createBlobWriteSasUrl: vi.fn(),
			createBlobReadSasUrl: vi.fn(),
			createContainerListSasUrl: vi.fn(),
		};

		const sasService = {
			startUp: vi.fn(),
			shutDown: vi.fn(),
			createBlobWriteSasUrl,
			createBlobReadSasUrl,
			uploadText: vi.fn(),
			deleteBlob: vi.fn(),
			listBlobs: vi.fn(),
			createContainerListSasUrl: vi.fn(),
		};

		const service = new ServiceBlobStorage({
			sdkService: sdkService as never,
			sasSigningService: sasService as never,
		});

		const request = {
			containerName: 'member-assets',
			blobName: 'avatars/member-123.png',
			expiresOn: new Date('2026-05-14T12:00:00.000Z'),
		};

		await expect(service.createUploadUrl(request)).resolves.toBe('https://...write-sas');
		expect(createBlobWriteSasUrl).toHaveBeenCalledWith(request);

		await expect(service.createReadUrl(request)).resolves.toBe('https://...read-sas');
		expect(createBlobReadSasUrl).toHaveBeenCalledWith(request);
	});

	it('throws when SAS URL methods called without SAS signing service', async () => {
		const sdkService = {
			startUp: vi.fn(),
			shutDown: vi.fn(),
			listBlobs: vi.fn(),
			uploadText: vi.fn(),
			deleteBlob: vi.fn(),
			createBlobWriteSasUrl: vi.fn(),
			createBlobReadSasUrl: vi.fn(),
			createContainerListSasUrl: vi.fn(),
		};

		const service = new ServiceBlobStorage({
			sdkService: sdkService as never,
			// No sasSigningService provided
		});

		const request = {
			containerName: 'member-assets',
			blobName: 'avatars/member-123.png',
			expiresOn: new Date('2026-05-14T12:00:00.000Z'),
		};

		await expect(service.createUploadUrl(request)).rejects.toThrow('Client uploads with SAS signing are not configured');
		await expect(service.createReadUrl(request)).rejects.toThrow('SAS read URLs are not configured');
	});

	it('returns self from startUp (no-op)', async () => {
		const sdkService = {
			startUp: vi.fn(),
			shutDown: vi.fn(),
			listBlobs: vi.fn(),
			uploadText: vi.fn(),
			deleteBlob: vi.fn(),
			createBlobWriteSasUrl: vi.fn(),
			createBlobReadSasUrl: vi.fn(),
			createContainerListSasUrl: vi.fn(),
		};

		const service = new ServiceBlobStorage({
			sdkService: sdkService as never,
		});

		const result = await service.startUp();
		expect(result).toBe(service);
	});

	it('handles shutdown gracefully (no-op)', async () => {
		const sdkService = {
			startUp: vi.fn(),
			shutDown: vi.fn(),
			listBlobs: vi.fn(),
			uploadText: vi.fn(),
			deleteBlob: vi.fn(),
			createBlobWriteSasUrl: vi.fn(),
			createBlobReadSasUrl: vi.fn(),
			createContainerListSasUrl: vi.fn(),
		};

		const service = new ServiceBlobStorage({
			sdkService: sdkService as never,
		});

		await expect(service.shutDown()).resolves.toBeUndefined();
	});
});
