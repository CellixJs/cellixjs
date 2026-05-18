import type { BlobHTTPHeaders, BlobUploadCommonResponse } from '@azure/storage-blob';

/**
 * Identifies a blob within Azure Blob Storage.
 *
 * @property containerName - Container holding the target blob.
 * @property blobName - Blob name relative to the container root.
 */
export interface BlobAddress {
	containerName: string;
	blobName: string;
}

/**
 * Request contract for uploading UTF-8 text content to a blob.
 *
 * @property text - Text payload to write to the blob.
 * @property httpHeaders - Optional HTTP headers, such as content type.
 * @property metadata - Optional blob metadata stored with the upload.
 * @property tags - Optional blob index tags.
 */
export interface UploadTextBlobRequest extends BlobAddress {
	text: string;
	httpHeaders?: BlobHTTPHeaders;
	metadata?: Record<string, string>;
	tags?: Record<string, string>;
}

/**
 * Request contract for listing blobs from a container.
 *
 * @property containerName - Container to enumerate.
 * @property prefix - Optional blob name prefix filter.
 */
export interface ListBlobsRequest {
	containerName: string;
	prefix?: string;
}

/**
 * Public summary returned for each listed blob.
 *
 * @property name - Blob name relative to the container.
 * @property url - Absolute blob URL.
 */
export interface BlobListItem {
	name: string;
	url: string;
}

/**
 * Request contract for generating a blob-scoped SAS URL.
 *
 * @property expiresOn - Expiration timestamp for the generated SAS URL.
 */
export interface CreateBlobSasUrlRequest extends BlobAddress {
	expiresOn: Date;
}

/**
 * Request contract for generating a container-scoped SAS URL.
 *
 * @property containerName - Container to grant access to.
 * @property expiresOn - Expiration timestamp for the generated SAS URL.
 */
export interface CreateContainerSasUrlRequest {
	containerName: string;
	expiresOn: Date;
}

/**
 * Framework-level blob storage contract used by application adapters.
 */
export interface BlobStorage {
	/**
	 * Uploads text into a blob and returns the Azure upload response.
	 */
	uploadText(request: UploadTextBlobRequest): Promise<BlobUploadCommonResponse>;

	/**
	 * Deletes a blob if it exists.
	 */
	deleteBlob(address: BlobAddress): Promise<void>;

	/**
	 * Lists blobs in a container, optionally filtered by prefix.
	 */
	listBlobs(request: ListBlobsRequest): Promise<BlobListItem[]>;

	/**
	 * Creates a blob-scoped read SAS URL.
	 */
	createBlobReadSasUrl(request: CreateBlobSasUrlRequest): Promise<string>;

	/**
	 * Creates a blob-scoped write SAS URL.
	 */
	createBlobWriteSasUrl(request: CreateBlobSasUrlRequest): Promise<string>;

	/**
	 * Creates a container-scoped SAS URL that allows listing blobs.
	 */
	createContainerListSasUrl(request: CreateContainerSasUrlRequest): Promise<string>;
}
