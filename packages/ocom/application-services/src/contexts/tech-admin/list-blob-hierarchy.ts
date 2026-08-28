import type { BlobHierarchyPage, BlobStorageOperations, ListBlobHierarchyRequest } from '@ocom/service-blob-storage';

export const ListBlobHierarchy = (blobStorageService: BlobStorageOperations) => {
	return async (command: ListBlobHierarchyRequest): Promise<BlobHierarchyPage> => {
		if (!command.containerName?.trim()) {
			throw new Error('containerName is required');
		}
		return await blobStorageService.listBlobHierarchy(command);
	};
};
