import type { BlobHTTPHeaders, BlobUploadCommonResponse } from '@azure/storage-blob';

/**
 * Identifies a blob within Azure Blob Storage.
 *
 * Use this shape anywhere the caller needs to point at a specific blob without
 * carrying transport or SDK details through the public contract.
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
 * `httpHeaders`, `metadata`, and `tags` are all optional and are passed
 * through to the Azure upload call when provided.
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
 * Consumers can use `prefix` to scope the listing to a logical folder or
 * naming convention within the container.
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
 * The contract intentionally exposes only the blob name and absolute URL.
 *
 * @property name - Blob name relative to the container.
 * @property url - Absolute blob URL.
 */
export interface BlobListItem {
	name: string;
	url: string;
}

/**
 * Request contract for generating a blob-scoped read SAS token.
 *
 * The resulting token is scoped to a single blob and a fixed expiration time.
 *
 * @property expiresOn - Expiration timestamp for the generated SAS URL.
 */
export interface CreateBlobSasUrlRequest extends BlobAddress {
	expiresOn: Date;
}

/**
 * Request contract for generating a blob-scoped signed authorization header.
 *
 * Use this when a client needs to upload or download a blob directly against
 * Azure Blob Storage while the framework controls the signature. The payload
 * details are part of the signature, so `contentLength`, `contentType`, and
 * any metadata must match the eventual request exactly.
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
 * Authorization details for direct client blob requests.
 *
 * The caller is responsible for sending these headers exactly as returned so
 * Azure can validate the signature.
 *
 * @property url - Direct upload URL to the blob endpoint.
 * @property authorizationHeader - Complete signed SharedKey authorization header value.
 * @property headers - Required request headers, including `Content-Type`, `Content-Length`,
 *           and any `x-ms-*` metadata headers.
 */
export interface BlobUploadAuthorizationHeader {
	url: string;
	authorizationHeader: string;
	headers: Record<string, string>;
}

/**
 * Framework-level blob storage contract used by application adapters.
 *
 * This is the public surface that downstream packages should adapt into a
 * narrower application-specific interface.
 */
export interface BlobStorage {
	/**
	 * Uploads UTF-8 text into a blob and returns the Azure upload response.
	 *
	 * The request may include headers, metadata, and tags.
	 */
	uploadText(request: UploadTextBlobRequest): Promise<BlobUploadCommonResponse>;

	/**
	 * Deletes a blob if it exists.
	 */
	deleteBlob(address: BlobAddress): Promise<void>;

	/**
	 * Lists blobs in a container, optionally filtered by prefix.
	 *
	 * The return value includes the blob name and absolute URL for each item.
	 */
	listBlobs(request: ListBlobsRequest): Promise<BlobListItem[]>;

	/**
	 * Generates a blob-scoped read SAS token.
	 *
	 * The token is returned as a query string without the leading `?`. Shared-key
	 * signing must be configured before calling this method.
	 */
	generateReadSasToken(request: CreateBlobSasUrlRequest): Promise<string>;

	/**
	 * Generates the signed authorization header details needed for a client-side
	 * blob write request.
	 *
	 * Requires the service instance to be configured with shared-key signing capability.
	 */
	createBlobWriteAuthorizationHeader(request: CreateBlobAuthorizationHeaderRequest): Promise<BlobUploadAuthorizationHeader>;

	/**
	 * Generates the signed authorization header details needed for a client-side
	 * blob read request.
	 *
	 * Requires the service instance to be configured with shared-key signing capability.
	 */
	createBlobReadAuthorizationHeader(request: CreateBlobAuthorizationHeaderRequest): Promise<BlobUploadAuthorizationHeader>;
}
