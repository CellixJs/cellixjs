import type { BlobStorageOperations, ClientUploadOperations } from '@ocom/service-blob-storage';
import { GetBlobContent } from './get-blob-content.ts';
import { ListBlobContainers } from './list-blob-containers.ts';
import { ListBlobHierarchy } from './list-blob-hierarchy.ts';
import { ListCollections } from './list-collections.ts';
import { DatabaseDocuments } from './query-documents.ts';

export { buildBlobListQueryCommand } from './blob-list.command-mapper.ts';
export { buildDatabaseDocumentsQueryCommand } from './database-documents.command-mapper.ts';

export interface TechAdminApplicationService {
	ListCollections: ReturnType<typeof ListCollections>;
	DatabaseDocuments: ReturnType<typeof DatabaseDocuments>;
	ListBlobContainers: ReturnType<typeof ListBlobContainers>;
	ListBlobHierarchy: ReturnType<typeof ListBlobHierarchy>;
	GetBlobContent: ReturnType<typeof GetBlobContent>;
}

export const TechAdmin = (blobStorageService: BlobStorageOperations, clientOperationsService?: ClientUploadOperations): TechAdminApplicationService => {
	return {
		ListCollections: ListCollections(),
		DatabaseDocuments: DatabaseDocuments(),
		ListBlobContainers: ListBlobContainers(blobStorageService),
		ListBlobHierarchy: ListBlobHierarchy(blobStorageService),
		GetBlobContent: GetBlobContent(blobStorageService, clientOperationsService),
	};
};
