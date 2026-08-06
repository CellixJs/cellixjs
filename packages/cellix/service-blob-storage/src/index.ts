export type { BlobUploadCommonResponse } from '@azure/storage-blob';
export type {
	BlobAddress,
	BlobContainerItem,
	BlobDownloadResult,
	BlobExplorerItem,
	BlobFolderItem,
	BlobHierarchyPage,
	BlobListItem,
	BlobStorage,
	BlobUploadAuthorizationHeader,
	ClientBlobStorage,
	CreateBlobAuthorizationHeaderRequest,
	CreateBlobSasUrlRequest,
	ListBlobHierarchyRequest,
	ListBlobsRequest,
	ServiceBlobStorageOptions,
	ServiceClientBlobStorageOptions,
	UploadTextBlobRequest,
} from './interfaces.ts';
export { BLOB_DOWNLOAD_MAX_BYTES } from './interfaces.ts';
/**
 * Managed-identity-backed framework blob-storage service for server-side blob operations.
 *
 * @returns A started service instance that exposes upload, list, delete, hierarchical
 * explorer listing, and download operations after `startUp()`.
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
