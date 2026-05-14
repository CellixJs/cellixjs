import type { BlobHTTPHeaders, BlobUploadCommonResponse } from '@azure/storage-blob';

/**
 * Identifies a blob within Azure Blob Storage.
 */
export interface BlobAddress {
	/**
	 * Container holding the target blob.
	 */
	containerName: string;

	/**
	 * Blob name relative to the container root.
	 */
	blobName: string;
}

/**
 * Request contract for uploading UTF-8 text content to a blob.
 */
export interface UploadTextBlobRequest extends BlobAddress {
	/**
	 * Text payload to write to the blob.
	 */
	text: string;

	/**
	 * Optional HTTP headers, such as content type.
	 */
	httpHeaders?: BlobHTTPHeaders;

	/**
	 * Optional blob metadata stored with the upload.
	 */
	metadata?: Record<string, string>;

	/**
	 * Optional blob index tags.
	 */
	tags?: Record<string, string>;
}

/**
 * Request contract for listing blobs from a container.
 */
export interface ListBlobsRequest {
	/**
	 * Container to enumerate.
	 */
	containerName: string;

	/**
	 * Optional blob name prefix filter.
	 */
	prefix?: string;
}

/**
 * Public summary returned for each listed blob.
 */
export interface BlobListItem {
	/**
	 * Blob name relative to the container.
	 */
	name: string;

	/**
	 * Absolute blob URL.
	 */
	url: string;
}

/**
 * Request contract for generating a blob-scoped SAS URL.
 */
export interface CreateBlobSasUrlRequest extends BlobAddress {
	/**
	 * Expiration timestamp for the generated SAS URL.
	 */
	expiresOn: Date;
}

/**
 * Request contract for generating a container-scoped SAS URL.
 */
export interface CreateContainerSasUrlRequest {
	/**
	 * Container to grant access to.
	 */
	containerName: string;

	/**
	 * Expiration timestamp for the generated SAS URL.
	 */
	expiresOn: Date;
}

/**
 * Framework-level blob storage contract used by application adapters.
 */
export interface BlobStorage {
	/**
	 * Uploads text into a blob and returns the Azure upload response.
	 *
	 * @example
	 * ```ts
	 * await blobStorage.uploadText({
	 *   containerName: 'reports',
	 *   blobName: '2026-05/summary.json',
	 *   text: '{"ok":true}',
	 *   httpHeaders: { blobContentType: 'application/json' },
	 * });
	 * ```
	 */
	uploadText(request: UploadTextBlobRequest): Promise<BlobUploadCommonResponse>;

	/**
	 * Deletes a blob if it exists.
	 *
	 * @example
	 * ```ts
	 * await blobStorage.deleteBlob({
	 *   containerName: 'reports',
	 *   blobName: '2026-05/summary.json',
	 * });
	 * ```
	 */
	deleteBlob(address: BlobAddress): Promise<void>;

	/**
	 * Lists blobs in a container, optionally filtered by prefix.
	 *
	 * @example
	 * ```ts
	 * const blobs = await blobStorage.listBlobs({
	 *   containerName: 'reports',
	 *   prefix: '2026-05/',
	 * });
	 * ```
	 */
	listBlobs(request: ListBlobsRequest): Promise<BlobListItem[]>;

	/**
	 * Creates a blob-scoped read SAS URL.
	 *
	 * @example
	 * ```ts
	 * const url = await blobStorage.createBlobReadSasUrl({
	 *   containerName: 'reports',
	 *   blobName: '2026-05/summary.json',
	 *   expiresOn: new Date(Date.now() + 60_000),
	 * });
	 * ```
	 */
	createBlobReadSasUrl(request: CreateBlobSasUrlRequest): Promise<string>;

	/**
	 * Creates a blob-scoped write SAS URL.
	 *
	 * @example
	 * ```ts
	 * const url = await blobStorage.createBlobWriteSasUrl({
	 *   containerName: 'uploads',
	 *   blobName: 'avatars/member-123.png',
	 *   expiresOn: new Date(Date.now() + 5 * 60_000),
	 * });
	 * ```
	 */
	createBlobWriteSasUrl(request: CreateBlobSasUrlRequest): Promise<string>;

	/**
	 * Creates a container-scoped SAS URL that allows listing blobs.
	 *
	 * @example
	 * ```ts
	 * const url = await blobStorage.createContainerListSasUrl({
	 *   containerName: 'uploads',
	 *   expiresOn: new Date(Date.now() + 60_000),
	 * });
	 * ```
	 */
	createContainerListSasUrl(request: CreateContainerSasUrlRequest): Promise<string>;
}
