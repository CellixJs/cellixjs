import type { BlobAddress, BlobListItem, BlobUploadAuthorizationHeader, CreateBlobAuthorizationHeaderRequest, ListBlobsRequest, UploadTextBlobRequest } from '@cellix/service-blob-storage';

export type CreateBlobAccessUrlRequest = CreateBlobAuthorizationHeaderRequest;

/**
 * Operations for server-side blob storage access via managed identity.
 * Subset of BlobStorage interface for backend operations.
 */
export interface BlobStorageOperations {
	listBlobs(request: ListBlobsRequest): Promise<BlobListItem[]>;
	uploadText(request: UploadTextBlobRequest): Promise<unknown>;
	deleteBlob(address: BlobAddress): Promise<void>;
}

/**
 * Operations for generating signed authorization headers for client-side uploads.
 * Returns canonical SharedKey authorization headers that lock blob metadata (content type, length).
 */
export interface ClientUploadService {
	createUploadUrl(request: CreateBlobAccessUrlRequest): Promise<BlobUploadAuthorizationHeader>;
	createReadUrl(request: CreateBlobAccessUrlRequest): Promise<BlobUploadAuthorizationHeader>;
}
