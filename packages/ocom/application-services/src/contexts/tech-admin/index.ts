import type { BlobStorageOperations, ClientUploadOperations } from '@ocom/service-blob-storage';
import { BlobExplorer, type BlobExplorerApplicationService } from './blob-explorer/index.ts';

export interface TechAdminContextApplicationService {
	BlobExplorer: BlobExplorerApplicationService;
}

export const TechAdmin = (blobStorageService: BlobStorageOperations, clientOperationsService: ClientUploadOperations): TechAdminContextApplicationService => {
	return {
		BlobExplorer: BlobExplorer(blobStorageService, clientOperationsService),
	};
};
