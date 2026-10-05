export type { BlobUploadCommonResponse } from '@azure/storage-blob';
export type {
	BlobAddress,
	BlobListItem,
	BlobProperties,
	BlobStorage,
	BlobUploadAuthorizationHeader,
	ClientBlobStorage,
	CreateBlobAuthorizationHeaderRequest,
	CreateBlobSasUrlRequest,
	CreateContainerRequest,
	CreateContainerSasRequest,
	DownloadBlobToFileRequest,
	ListBlobsRequest,
	ServiceBlobStorageOptions,
	ServiceClientBlobStorageOptions,
	UploadFileBlobRequest,
	UploadTextBlobRequest,
} from './interfaces.ts';
/**
 * Managed-identity-backed framework blob-storage service for server-side blob operations.
 *
 * @returns A started service instance that exposes text and file upload, file download, list, and delete operations after `startUp()`.
 *
 * @example
 * ```ts
 * const blobStorage = new ServiceBlobStorage({
 *   accountName: 'mystorageaccount',
 * });
 * ```
 */
export { ServiceBlobStorage } from './service-blob-storage.ts';
/**
 * Managed-identity-backed framework blob-storage service that additionally supports SharedKey signing.
 *
 * @returns A started service instance that exposes the base blob operations plus client-signing helpers after `startUp()`.
 *
 * @example
 * ```ts
 * const clientBlobStorage = new ServiceClientBlobStorage({
 *   accountName: 'mystorageaccount',
 *   signingConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING!,
 * });
 * ```
 */
export { ServiceClientBlobStorage } from './service-client-blob-storage.ts';
