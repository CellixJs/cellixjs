import type { BlobStorage as CellixBlobStorage } from '@cellix/service-blob-storage';
import type { BlobStorage } from './blob-storage.contract.ts';

/**
 * Narrows the framework blob service to the small OwnerCommunity contract exposed through ApiContext.
 */
export function createBlobStorage(blobStorage: CellixBlobStorage): BlobStorage {
	return {
		createUploadUrl: (request) => blobStorage.createBlobWriteSasUrl(request),
		createReadUrl: (request) => blobStorage.createBlobReadSasUrl(request),
	};
}
