import type {
	BlobExplorerHierarchyPage,
	BlobStorageOperations,
	BlobUploadAuthorizationHeader,
	ClientUploadOperations,
	CreateBlobAuthorizationHeaderRequest,
	ListBlobsHierarchyRequest,
	ListContainersResult,
} from '@ocom/service-blob-storage';

export type GetBlobDownloadAuthorizationRequest = CreateBlobAuthorizationHeaderRequest;

export interface BlobExplorerApplicationService {
	listContainers: () => Promise<ListContainersResult>;
	listBlobsHierarchy: (request: ListBlobsHierarchyRequest) => Promise<BlobExplorerHierarchyPage>;
	getBlobDownloadAuthorization: (request: GetBlobDownloadAuthorizationRequest) => Promise<BlobUploadAuthorizationHeader>;
}

export const BlobExplorer = (blobStorageService: BlobStorageOperations, clientOperationsService: ClientUploadOperations): BlobExplorerApplicationService => {
	return {
		listContainers: () => blobStorageService.listContainers(),
		listBlobsHierarchy: (request: ListBlobsHierarchyRequest) => blobStorageService.listBlobsHierarchy(request),
		getBlobDownloadAuthorization: (request: GetBlobDownloadAuthorizationRequest) => clientOperationsService.createBlobReadAuthorizationHeader(request),
	};
};
