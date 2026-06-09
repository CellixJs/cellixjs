import type { TokenCredential } from '@azure/identity';
import type { BlobHTTPHeaders, BlobUploadCommonResponse } from '@azure/storage-blob';

/**
 * Identifies a single blob within Azure Blob Storage.
 *
 * The framework uses this value object anywhere a caller needs to target an
 * existing blob without exposing Azure SDK client types in the public API.
 * `containerName` selects the blob container and `blobName` identifies the
 * blob path within that container.
 *
 * @example
 * ```ts
 * const address: BlobAddress = {
 *   containerName: 'private',
 *   blobName: 'communities/community-123/audit.log',
 * };
 * ```
 *
 * @remarks
 * `blobName` may contain slash-delimited segments. Azure Blob Storage treats
 * those segments as part of the blob name rather than as real folders.
 *
 * @property containerName - Name of the Azure Blob container that stores the blob.
 * @property blobName - Blob path relative to the container root.
 */
export interface BlobAddress {
	containerName: string;
	blobName: string;
}

/**
 * Request contract for uploading UTF-8 text content to a blob.
 *
 * Use this with `BlobStorage.uploadText()` when the server needs to write
 * structured text, audit logs, JSON documents, or other UTF-8 content into
 * Azure Blob Storage. Optional headers, metadata, and tags are forwarded to
 * Azure so callers can control content type and blob annotations without
 * depending on Azure SDK types outside this contract.
 *
 * The payload is written as text exactly as provided. Callers are responsible
 * for serializing objects to JSON before invoking the upload.
 *
 * @example
 * ```ts
 * await blobStorage.uploadText({
 *   containerName: 'private',
 *   blobName: 'communities/community-123/audit.log',
 *   text: 'Community created',
 *   httpHeaders: { blobContentType: 'text/plain; charset=utf-8' },
 *   metadata: { eventType: 'CommunityCreated' },
 * });
 * ```
 *
 * @remarks
 * Use this contract for text-based payloads only. Binary uploads are expected
 * to use direct-to-blob client flows built on `ClientBlobStorage`.
 *
 * @property text - UTF-8 text payload to write to the target blob.
 * @property httpHeaders - Optional Azure blob HTTP headers such as content type or caching.
 * @property metadata - Optional blob metadata stored with the upload.
 * @property tags - Optional blob index tags applied to the uploaded blob.
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
 * Use this with `BlobStorage.listBlobs()` to enumerate blobs in a container,
 * optionally scoped to a logical folder or naming convention with `prefix`.
 * The returned list is flattened and does not expose Azure paging or iterator
 * details through the public contract.
 *
 * @example
 * ```ts
 * const blobs = await blobStorage.listBlobs({
 *   containerName: 'private',
 *   prefix: 'communities/community-123/',
 * });
 * ```
 *
 * @remarks
 * The listing is flat. A prefix narrows results by name and is commonly used to
 * emulate folder-style grouping.
 *
 * @property containerName - Name of the Azure Blob container to enumerate.
 * @property prefix - Optional blob-name prefix used to narrow the results.
 */
export interface ListBlobsRequest {
	containerName: string;
	prefix?: string;
}

/**
 * Public summary returned for each listed blob.
 *
 * The framework intentionally returns a narrow summary instead of Azure SDK
 * blob models so consumers can inspect available blobs without being coupled to
 * Azure response types.
 *
 * @property name - Blob path relative to the container root.
 * @property url - Absolute blob URL for that item.
 *
 */
export interface BlobListItem {
	name: string;
	url: string;
}

/**
 * Request contract for generating a blob-scoped read SAS token.
 *
 * Use this with `ClientBlobStorage.generateReadSasToken()` when a server needs
 * to grant temporary direct read access to one specific blob without proxying
 * the file contents through the application.
 *
 * The resulting token is restricted to the target blob and expires at the
 * provided timestamp.
 *
 * @example
 * ```ts
 * const sas = await clientBlobStorage.generateReadSasToken({
 *   containerName: 'private',
 *   blobName: 'documents/report.pdf',
 *   expiresOn: new Date(Date.now() + 5 * 60 * 1000),
 * });
 * ```
 *
 * @remarks
 * The returned value is only the query-string portion of the SAS token. Append
 * it to a blob URL when constructing a client-facing link.
 *
 * @property expiresOn - Expiration timestamp for the generated SAS URL.
 */
export interface CreateBlobSasUrlRequest extends BlobAddress {
	expiresOn: Date;
}

/**
 * Request contract for generating a blob-scoped signed authorization header.
 *
 * Use this when a browser or mobile client will talk directly to Azure Blob
 * Storage and the framework must pre-sign the request. The request details form
 * part of the SharedKey signature, so `contentLength`, `contentType`, and any
 * metadata must exactly match the eventual client request.
 *
 * This contract is shared by both write-authorization and read-authorization
 * generation because both operations need an exact blob target plus the HTTP
 * request shape that Azure will validate.
 *
 * @example
 * ```ts
 * const auth = await clientBlobStorage.createBlobWriteAuthorizationHeader({
 *   containerName: 'member-assets',
 *   blobName: 'members/123/avatar.png',
 *   contentLength: 1024,
 *   contentType: 'image/png',
 *   metadata: { uploadedBy: 'member-123' },
 * });
 * ```
 *
 * @remarks
 * Any mismatch between this request and the eventual client request can cause
 * Azure Blob Storage to reject the signed request.
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
 * Authorization details for a direct client request to Azure Blob Storage.
 *
 * The caller must send the returned URL and headers exactly as provided. Azure
 * validates the signature against these values, so modifying the request after
 * generation can invalidate the authorization.
 *
 * This contract is used for client-side upload or download flows where the
 * application signs the request but does not proxy the blob payload itself.
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
 * Framework-level contract for server-side Azure Blob Storage operations.
 *
 * This interface represents the minimal backend blob functionality the package
 * exposes for managed-identity-based applications: write UTF-8 text blobs,
 * delete blobs, and enumerate blobs. It intentionally avoids exposing Azure SDK
 * clients or connection-string concerns.
 *
 * Consumers typically use this contract through `ServiceBlobStorage`, register
 * it in infrastructure, and adapt it into narrower application-specific ports.
 *
 * Lifecycle:
 * Callers are expected to create a service instance, call `startUp()`, and then
 * use these operations for the lifetime of the process.
 *
 * @example
 * ```ts
 * const blobStorage = new ServiceBlobStorage({
 *   accountName: 'mystorageaccount',
 * });
 *
 * await blobStorage.startUp();
 * await blobStorage.uploadText({
 *   containerName: 'private',
 *   blobName: 'health/startup.txt',
 *   text: 'ready',
 * });
 * ```
 *
 * @remarks
 * This contract models the steady-state operations available after the
 * framework service has been started. Construction and lifecycle management are
 * handled by the exported service classes.
 */
export interface BlobStorage {
	/**
	 * Uploads UTF-8 text into a blob and returns the Azure upload response.
	 *
	 * This is intended for server-side writes such as logs, generated JSON,
	 * serialized projections, or other application-owned text payloads.
	 *
	 * @param request - Target container/blob plus the text payload and optional
	 * Azure headers, metadata, or tags to apply to the uploaded blob.
	 * @returns A promise that resolves with the Azure SDK upload response for the
	 * completed write operation.
	 */
	uploadText(request: UploadTextBlobRequest): Promise<BlobUploadCommonResponse>;

	/**
	 * Deletes a blob at the given address.
	 *
	 * Use this to remove application-managed content without exposing Azure SDK
	 * delete semantics in downstream code.
	 *
	 * @param address - Container and blob name identifying the blob to delete.
	 * @returns A promise that resolves when Azure has accepted the delete
	 * operation.
	 */
	deleteBlob(address: BlobAddress): Promise<void>;

	/**
	 * Lists blobs in a container, optionally filtered by prefix.
	 *
	 * The return value includes only the blob name and absolute URL for each
	 * matching item.
	 *
	 * @param request - Container to enumerate and an optional blob-name prefix
	 * used to narrow the results.
	 * @returns A promise that resolves to a flat list of matching blobs.
	 */
	listBlobs(request: ListBlobsRequest): Promise<BlobListItem[]>;
}

/**
 * Framework-level contract for blob operations plus direct-client signing flows.
 *
 * This extends `BlobStorage` for applications that need both backend blob
 * operations and SharedKey-based signing so browsers or mobile clients can talk
 * directly to Azure Blob Storage.
 *
 * Consumers typically use this contract through `ServiceClientBlobStorage` when
 * they need to:
 * - generate temporary read SAS tokens
 * - generate SharedKey authorization headers for direct uploads
 * - generate SharedKey authorization headers for direct reads
 *
 * This contract requires shared-key configuration in addition to the base
 * managed-identity account configuration.
 *
 * @remarks
 * Use this contract when the application server should authorize blob access
 * but the client should transfer the bytes directly to or from Azure Blob
 * Storage.
 */
export interface ClientBlobStorage extends BlobStorage {
	/**
	 * Generates a blob-scoped read SAS token.
	 *
	 * The token is returned as a query string without the leading `?` and is
	 * intended to be appended to a blob URL.
	 *
	 * @param request - Target blob and expiration timestamp for the temporary
	 * read permission.
	 * @returns A promise that resolves to the SAS token query string without a
	 * leading question mark.
	 */
	generateReadSasToken(request: CreateBlobSasUrlRequest): Promise<string>;

	/**
	 * Generates the signed authorization header details needed for a client-side
	 * blob write request.
	 *
	 * Use this when the application wants the client to upload directly to Azure
	 * Blob Storage without routing the payload through the server.
	 *
	 * @param request - Blob target plus the exact HTTP request details that Azure
	 * will validate when the client performs the upload.
	 * @returns A promise that resolves to the direct blob URL, authorization
	 * header, and required request headers for the upload.
	 */
	createBlobWriteAuthorizationHeader(request: CreateBlobAuthorizationHeaderRequest): Promise<BlobUploadAuthorizationHeader>;

	/**
	 * Generates the signed authorization header details needed for a client-side
	 * blob read request.
	 *
	 * Use this when the application wants the client to download directly from
	 * Azure Blob Storage with a server-generated SharedKey authorization header.
	 *
	 * @param request - Blob target plus the exact HTTP request details that Azure
	 * will validate when the client performs the read request.
	 * @returns A promise that resolves to the direct blob URL, authorization
	 * header, and required request headers for the download.
	 */
	createBlobReadAuthorizationHeader(request: CreateBlobAuthorizationHeaderRequest): Promise<BlobUploadAuthorizationHeader>;
}

/**
 * Options for constructing the managed-identity blob storage service.
 *
 * Use these options with `ServiceBlobStorage`, the framework service that
 * performs backend blob operations by authenticating with managed identity or a
 * supplied token credential.
 *
 * `accountName` is allowed to be `undefined` so applications can pass env-based
 * configuration through directly. The framework validates the option at runtime
 * and throws if it is missing or empty.
 *
 * This configuration intentionally does not accept any connection string. If an
 * application needs SharedKey signing for direct client uploads or downloads,
 * use `ServiceClientBlobStorageOptions` instead.
 *
 * @example
 * ```ts
 * const blobStorage = new ServiceBlobStorage({
 *   accountName: 'mystorageaccount',
 * });
 * ```
 *
 * @property accountName - Azure Storage account name used to construct the blob
 * service endpoint URL.
 * @property credential - Optional Azure token credential. When omitted, the
 * service creates a `DefaultAzureCredential` during startup.
 */
export interface ServiceBlobStorageOptions {
	accountName: string | undefined;
	credential?: TokenCredential;
}

/**
 * Options for constructing the client-signing blob storage service.
 *
 * Use these options with `ServiceClientBlobStorage`, the framework service that
 * combines the base managed-identity blob operations with SharedKey signing for
 * direct client interactions with Azure Blob Storage.
 *
 * `accountName` and `signingConnectionString` may both be `undefined` when the
 * values come from environment variables. The constructor validates them and
 * throws if the service cannot be configured.
 *
 * This extends the base service options with the required connection string
 * used to derive the storage account name and account key for signing.
 *
 * In production, callers typically provide:
 * - `accountName` from environment or infrastructure config for base blob access
 * - `signingConnectionString` from a secret store for SharedKey signing
 *
 * @example
 * ```ts
 * const clientBlobStorage = new ServiceClientBlobStorage({
 *   accountName: 'mystorageaccount',
 *   signingConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING!,
 * });
 * ```
 *
 * @property signingConnectionString - Azure Storage connection string used only
 * for SharedKey signing. It must contain `AccountName` and `AccountKey`.
 */
export interface ServiceClientBlobStorageOptions extends ServiceBlobStorageOptions {
	signingConnectionString: string | undefined;
}
