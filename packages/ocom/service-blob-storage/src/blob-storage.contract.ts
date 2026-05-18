import type { CreateBlobSasUrlRequest } from '@cellix/service-blob-storage';

export interface CreateBlobAccessUrlRequest extends CreateBlobSasUrlRequest {}

export interface BlobStorage {
	/**
	 * List all blobs in a container.
	 */
	listBlobs(containerName: string): Promise<string[]>;

	/**
	 * Upload text content to a blob.
	 */
	uploadText(containerName: string, blobName: string, text: string): Promise<void>;

	/**
	 * Delete a blob.
	 */
	deleteBlob(containerName: string, blobName: string): Promise<void>;

	/**
	 * Generate a signed URL for client-side blob upload (write-only, time-limited).
	 * Only available if SAS signing service is configured.
	 */
	createUploadUrl(request: CreateBlobAccessUrlRequest): Promise<string>;

	/**
	 * Generate a signed URL for client-side blob read (read-only, time-limited).
	 * Only available if SAS signing service is configured.
	 */
	createReadUrl(request: CreateBlobAccessUrlRequest): Promise<string>;
}
