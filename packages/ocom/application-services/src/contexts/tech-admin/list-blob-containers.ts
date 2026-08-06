import type { BlobContainerItem, BlobStorageOperations } from '@ocom/service-blob-storage';

export const ListBlobContainers = (blobStorageService: BlobStorageOperations) => {
	return async (): Promise<BlobContainerItem[]> => {
		return await blobStorageService.listContainers();
	};
};
