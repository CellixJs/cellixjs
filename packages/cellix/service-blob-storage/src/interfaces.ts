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
 * Request contract for generating a blob-scoped signed authorization header.
 * Used for client-side direct uploads to Azure Blob Storage with metadata locking.
 *
 * @property contentLength - Size of the blob being uploaded, in bytes.
 * @property contentType - MIME type of the blob (e.g., 'application/json').
 * @property metadata - Optional blob metadata to store with the upload.
 */
export interface CreateBlobAuthorizationHeaderRequest extends BlobAddress {
	contentLength: number;
	contentType: string;
	metadata?: Record<string, string>;
}

/**
 * Authorization details for direct client uploads to Azure Blob Storage.
 * Contains the signed Authorization header and required request information.
 *
 * @property url - Direct upload URL to the blob endpoint.
 * @property authorizationHeader - Complete signed SharedKey authorization header value
 *           in format "SharedKey accountName:signature". Client uses this directly
 *           as the Authorization header when making PUT requests to the blob endpoint.
 * @property headers - Additional headers required for the upload request (Content-Type,
 *           Content-Length, x-ms-* metadata headers). Client must include all these
 *           headers in the PUT request for the signature to remain valid.
 */
export interface BlobUploadAuthorizationHeader {
	url: string;
	authorizationHeader: string;
	headers: Record<string, string>;
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
	 * Generates a blob-scoped read SAS token using managed identity credentials.
	 * Used for read-only access (e.g., viewing files).
	 * Returns the SAS query string (without the leading `?`).
	 */
	generateReadSasToken(request: CreateBlobSasUrlRequest): Promise<string>;
}
