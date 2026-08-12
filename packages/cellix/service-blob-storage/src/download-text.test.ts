import { describe, expect, it, vi } from 'vitest';
import { ServiceBlobStorage } from './index.ts';

class TestServiceBlobStorage extends ServiceBlobStorage {
	public useBlobServiceClient(blobServiceClient: never): void {
		this.setBlobServiceClient(blobServiceClient);
	}
}

function createBlobServiceClient(downloadToBuffer: ReturnType<typeof vi.fn>): never {
	return {
		getContainerClient: vi.fn().mockReturnValue({
			getBlockBlobClient: vi.fn().mockReturnValue({ downloadToBuffer }),
		}),
	} as never;
}

describe('@cellix/service-blob-storage ServiceBlobStorage.downloadText', () => {
	it('returns UTF-8 text from an existing blob', async () => {
		const service = new TestServiceBlobStorage({ accountName: 'storageaccount' });
		service.useBlobServiceClient(createBlobServiceClient(vi.fn().mockResolvedValue(Buffer.from('{"FeatureFlags":[]}'))));

		await expect(service.downloadText({ containerName: 'public', blobName: 'flags.json' })).resolves.toBe('{"FeatureFlags":[]}');
	});

	it('returns undefined when the blob does not exist', async () => {
		const service = new TestServiceBlobStorage({ accountName: 'storageaccount' });
		service.useBlobServiceClient(createBlobServiceClient(vi.fn().mockRejectedValue(Object.assign(new Error('The specified blob does not exist.'), { code: 'BlobNotFound' }))));

		await expect(service.downloadText({ containerName: 'public', blobName: 'flags.json' })).resolves.toBeUndefined();
	});
});
