import type { CreateBlobAuthorizationHeaderRequest, FeatureFlagStore, ServiceBlobStorage, ServiceClientBlobStorage } from '@cellix/service-blob-storage';

export type CreateBlobAccessUrlRequest = CreateBlobAuthorizationHeaderRequest;

/** Type-level marker for blob-storage services with feature flags enabled. */
export interface FeatureFlagsEnabled {
	readonly featureFlagsEnabled: true;
}

/**
 * Server-side blob storage operations exposed to application services.
 *
 * This is a narrow view of the framework `ServiceBlobStorage` class so the
 * application can depend on only the backend blob methods without redefining
 * their documentation locally.
 */
export type BlobStorageOperations<FeatureFlags extends FeatureFlagsEnabled | undefined = undefined> = Pick<ServiceBlobStorage, 'listBlobs' | 'uploadText' | 'deleteBlob'> &
	(FeatureFlags extends FeatureFlagsEnabled ? FeatureFlagStore : object);

/**
 * Client-side blob signing operations.
 *
 * This is a narrow view of the framework `ServiceClientBlobStorage` class for
 * SharedKey signing workflows used by browser uploads and downloads.
 */
export type ClientUploadOperations = Pick<ServiceClientBlobStorage, 'createBlobWriteAuthorizationHeader' | 'createBlobReadAuthorizationHeader'>;
