import type { BlobAddress, BlobListItem, CreateBlobSasUrlRequest, ListBlobsRequest, UploadTextBlobRequest } from '@cellix/service-blob-storage';

export type CreateBlobAccessUrlRequest = CreateBlobSasUrlRequest;

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
 * Operations for generating signed SAS URLs for client-side uploads.
 * Adapter interface over the framework's createBlobWriteSasUrl and createBlobReadSasUrl methods.
 */
export interface ClientUploadService {
	createUploadUrl(request: CreateBlobAccessUrlRequest): Promise<string>;
	createReadUrl(request: CreateBlobAccessUrlRequest): Promise<string>;
}
