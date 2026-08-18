export type { BlobUploadCommonResponse } from '@azure/storage-blob';
export {
	createFeatureFlagEnabledBlobStorageService,
	createFeatureFlagStore,
	enableFeatureFlags,
	type FeatureFlag,
	type FeatureFlagEnabledBlobStorage,
	type FeatureFlagStore,
	type FeatureFlagStoreOptions,
	type FeatureFlagsPayload,
} from './feature-flag-store.ts';
export type {
	BlobAddress,
	BlobListItem,
	BlobStorage,
	BlobUploadAuthorizationHeader,
	ClientBlobStorage,
	CreateBlobAuthorizationHeaderRequest,
	CreateBlobSasUrlRequest,
	ListBlobsRequest,
	ServiceBlobStorageOptions,
	ServiceClientBlobStorageOptions,
	UploadTextBlobRequest,
} from './interfaces.ts';
/**
 * Managed-identity-backed framework blob-storage service for server-side blob operations.
 *
 * @returns A started service instance that exposes upload, list, and delete operations after `startUp()`.
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
