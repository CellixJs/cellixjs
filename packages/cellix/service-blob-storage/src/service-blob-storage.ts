import { DefaultAzureCredential, type TokenCredential } from '@azure/identity';
import { BlobSASPermissions, BlobServiceClient, type BlobUploadCommonResponse, generateBlobSASQueryParameters, StorageSharedKeyCredential } from '@azure/storage-blob';
import type { ServiceBase } from '@cellix/api-services-spec';
import { ClientUploadSigner } from './client-upload-signer.js';
import { getConnectionStringValue } from './connection-string.ts';
import type { BlobAddress, BlobListItem, BlobStorage, BlobUploadAuthorizationHeader, CreateBlobAuthorizationHeaderRequest, CreateBlobSasUrlRequest, ListBlobsRequest, UploadTextBlobRequest } from './interfaces.ts';

/**
 * Options for constructing the framework blob-storage service.
 *
 * NOTE: This constructor is intentionally scoped for framework-level instantiation only.
 * Applications should not construct a framework ServiceBlobStorage instance to perform
 * client upload signing or blob operations directly. Instead, register the framework
 * services during application bootstrap and retrieve the narrow adapter contracts from
 * the service registry.
 *
 * The constructor separates two concerns:
 * - blob SDK authentication for server-side operations
 * - optional shared-key signing for direct client upload/read flows
 *
 * Blob SDK authentication options:
 * - `{ accountName, credential? }`: use managed identity (or supplied TokenCredential) for blob SDK operations
 *
 * Shared-key signing is an explicit opt-in capability:
 * - `{ signingConnectionString }`: 
 *   enables `createBlobWriteAuthorizationHeader()`, `createBlobReadAuthorizationHeader()`, and `generateReadSasToken()`
 *   without changing how the blob SDK client authenticates
 *
 * @example
 * ```ts
 * const backendBlobService = new ServiceBlobStorage({
 *   accountName: 'mystorageaccount',
 * });
 *
 * const clientUploadService = new ServiceBlobStorage({
 *   accountName: 'mystorageaccount',
 *   signingConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING!,
 * });
 * ```
 */
type ManagedIdentityBlobClientOptions = {
	accountName: string;
	credential?: TokenCredential;
	signingConnectionString?: string;
};

export type ServiceBlobStorageOptions = ManagedIdentityBlobClientOptions;

/**
 * Validates the provided options at construction time and infers the blob SDK auth mode.
 */
function validateOptions(options: ServiceBlobStorageOptions): void {
	const hasAccountName = 'accountName' in options && !!options.accountName?.trim();

	if (!hasAccountName) {
		throw new Error("Provide an 'accountName' for blob client authentication");
	}

	if ('signingConnectionString' in options && typeof options.signingConnectionString === 'string' && !options.signingConnectionString.trim()) {
		throw new Error("'signingConnectionString' must be a non-empty string when provided");
	}
}

/**
 * Azure Blob Storage infrastructure service for Cellix bootstraps.
 *
 * The service owns Azure Blob client construction, server-side blob operations,
 * and optional SharedKey signing for direct client upload and download flows.
 * It is the framework-level boundary that application packages adapt into
 * narrower app-specific contracts.
 *
 * Runtime behavior is split intentionally:
 * - server-side blob operations use managed identity by default and fall back to a local Azurite connection string only when the environment clearly points at an emulator
 * - direct client signing is opt-in through `signingConnectionString`
 *
 * @example
 * ```ts
 * const blobStorage = new ServiceBlobStorage({
 *   accountName: 'mystorageaccount',
 * });
 *
 * await blobStorage.startUp();
 * await blobStorage.uploadText({
 *   containerName: 'member-assets',
 *   blobName: 'members/123/profile.json',
 *   text: '{"hello":"world"}',
 * });
 * ```
 */
export class ServiceBlobStorage implements ServiceBase<BlobStorage>, BlobStorage {
	private readonly options: ServiceBlobStorageOptions;
	private blobServiceClientInternal: BlobServiceClient | undefined;
	private sharedKeyCredentialInternal: StorageSharedKeyCredential | undefined;
	private clientUploadSignerInternal: ClientUploadSigner | undefined;

	/**
	 * Creates a blob storage service with either server-side Blob SDK auth or
	 * optional SharedKey signing for direct client flows.
	 *
	 * @param options Authentication and signing configuration.
	 */
	constructor(options: ServiceBlobStorageOptions) {
		validateOptions(options);
		this.options = options;
	}

	/**
	 * Starts the underlying Azure Blob client and returns the started service contract.
	 *
	 * Call this during application bootstrap before invoking any blob operations or
	 * client-signing helpers.
	 */
	public async startUp(): Promise<BlobStorage> {
		// Avoid startup-time IMDS probes in environments without managed identity by deferring
		// token acquisition to the Azure SDK. Keep function async and include a no-op await
		// to satisfy the linter which enforces at least one await in async functions.
		await Promise.resolve();

		// managed identity flow
		const { accountName, signingConnectionString, credential } = this.options;
		const { AZURE_STORAGE_CONNECTION_STRING: connectionString } = process.env;
		if (connectionString) {
			const configuredAccountName = getConnectionStringValue(connectionString, 'AccountName');
			const blobEndpoint = getConnectionStringValue(connectionString, 'BlobEndpoint');
			if (configuredAccountName?.trim().toLowerCase() === accountName.trim().toLowerCase()) {
				if (isLocalBlobConnectionString(connectionString, blobEndpoint)) {
					this.blobServiceClientInternal = BlobServiceClient.fromConnectionString(connectionString);
					if (signingConnectionString) {
						this.configureSharedKeySigning(signingConnectionString, this.blobServiceClientInternal.url);
					}
					console.info(`[ServiceBlobStorage] started (localEmulator). account=${accountName}, endpoint=${this.blobServiceClientInternal.url}`);
					return this;
				}
				if (blobEndpoint) {
					const credentialToUse: TokenCredential = credential ?? new DefaultAzureCredential();
					this.blobServiceClientInternal = new BlobServiceClient(blobEndpoint, credentialToUse);
					if (signingConnectionString) {
						this.configureSharedKeySigning(signingConnectionString, this.blobServiceClientInternal.url);
					}
					console.info(`[ServiceBlobStorage] started (managedIdentity). account=${accountName}, endpoint=${blobEndpoint}`);
					return this;
				}
			}
		}

		const credentialToUse: TokenCredential = credential ?? new DefaultAzureCredential();
		const url = `https://${accountName}.blob.core.windows.net`;

		// Construct the client and defer token acquisition to the SDK. This avoids
		// startup-time hangs when IMDS isn't available (local dev). Operations will
		// fail at call time if the environment doesn't provide a valid managed identity.
		this.blobServiceClientInternal = new BlobServiceClient(url, credentialToUse);
		if (signingConnectionString) {
			this.configureSharedKeySigning(signingConnectionString, this.blobServiceClientInternal.url);
		}
		console.info(`[ServiceBlobStorage] started (managedIdentity). account=${accountName}, endpoint=${url}`);
		return this;
	}

	/**
	 * Clears the started state.
	 *
	 * Returns immediately when the service was never started.
	 *
	 * @returns A promise that resolves when internal state has been cleared.
	 */
	public shutDown(): Promise<void> {
		if (!this.blobServiceClientInternal) {
			return Promise.resolve();
		}

		this.blobServiceClientInternal = undefined;
		this.sharedKeyCredentialInternal = undefined;
		this.clientUploadSignerInternal = undefined;
		return Promise.resolve();
	}

	/**
	 * Uploads UTF-8 text to a blob and returns the Azure upload response.
	 *
	 * @param request Blob target plus text payload and optional headers, metadata, and tags.
	 * @returns The Azure storage SDK upload result for the completed write.
	 *
	 * @example
	 * ```ts
	 * await blobStorage.uploadText({
	 *   containerName: 'member-assets',
	 *   blobName: 'members/123/profile.json',
	 *   text: '{"hello":"world"}',
	 * });
	 * ```
	 */
	public async uploadText(request: UploadTextBlobRequest): Promise<BlobUploadCommonResponse> {
		const blockBlobClient = this.getContainerClient(request.containerName).getBlockBlobClient(request.blobName);
		const uploadOptions = {
			...(request.httpHeaders ? { blobHTTPHeaders: request.httpHeaders } : {}),
			...(request.metadata ? { metadata: request.metadata } : {}),
			...(request.tags ? { tags: request.tags } : {}),
		};
		return await blockBlobClient.upload(request.text, Buffer.byteLength(request.text), {
			...uploadOptions,
		});
	}

	/**
	 * Deletes a blob if it exists.
	 *
	 * @param address Container and blob name that identify the blob to delete.
	 * @returns A promise that resolves when the delete call completes.
	 */
	public async deleteBlob(address: BlobAddress): Promise<void> {
		await this.getContainerClient(address.containerName).deleteBlob(address.blobName);
	}

	/**
	 * Lists blobs in a container, optionally filtered by prefix.
	 *
	 * @param request Container to enumerate plus an optional prefix filter.
	 * @returns A list of blob names and absolute URLs for the matching blobs.
	 *
	 * @example
	 * ```ts
	 * const blobs = await blobStorage.listBlobs({
	 *   containerName: 'member-assets',
	 *   prefix: 'members/',
	 * });
	 * ```
	 */
	public async listBlobs(request: ListBlobsRequest): Promise<BlobListItem[]> {
		const containerClient = this.getContainerClient(request.containerName);
		const blobs: BlobListItem[] = [];
		const listOptions = request.prefix ? { prefix: request.prefix } : undefined;

		for await (const blob of containerClient.listBlobsFlat(listOptions)) {
			blobs.push({
				name: blob.name,
				url: containerClient.getBlockBlobClient(blob.name).url,
			});
		}

		return blobs;
	}

	/**
	 * Generates a blob-scoped read SAS token.
	 *
	 * @param request Blob target and expiration for the SAS token.
	 * @returns The SAS query string without a leading `?`.
	 * @throws If shared-key signing was not configured at startup.
	 *
	 * @example
	 * ```ts
	 * const sas = await blobStorage.generateReadSasToken({
	 *   containerName: 'member-assets',
	 *   blobName: 'members/123/avatar.png',
	 *   expiresOn: new Date(Date.now() + 15 * 60_000),
	 * });
	 * ```
	 */
	public generateReadSasToken(request: CreateBlobSasUrlRequest): Promise<string> {
		if (!this.sharedKeyCredentialInternal) {
			return Promise.reject(new Error('Shared-key signing is not configured; provide signingConnectionString'));
		}

		const sas = generateBlobSASQueryParameters(
			{
				containerName: request.containerName,
				blobName: request.blobName,
				expiresOn: request.expiresOn,
				permissions: BlobSASPermissions.parse('r'),
			},
			this.sharedKeyCredentialInternal,
		).toString();

		return Promise.resolve(sas);
	}

	/**
	 * Generates the signed authorization header details needed for a client-side
	 * blob write request.
	 *
	 * @param request Blob target plus payload details that must match the eventual client request.
	 * @returns URL, authorization header, and required request headers for the upload call.
	 * @throws If shared-key signing was not configured at startup.
	 *
	 * @example
	 * ```ts
	 * const auth = await blobStorage.createBlobWriteAuthorizationHeader({
	 *   containerName: 'member-assets',
	 *   blobName: 'members/123/avatar.png',
	 *   contentLength: file.size,
	 *   contentType: file.type,
	 * });
	 * ```
	 */
	public createBlobWriteAuthorizationHeader(request: CreateBlobAuthorizationHeaderRequest): Promise<BlobUploadAuthorizationHeader> {
		if (!this.clientUploadSignerInternal) {
			return Promise.reject(new Error('Shared-key signing is not configured; provide signingConnectionString'));
		}
		return this.clientUploadSignerInternal.createBlobWriteAuthorizationHeader(request);
	}

	/**
	 * Generates the signed authorization header details needed for a client-side
	 * blob read request.
	 *
	 * @param request Blob target plus payload details that must match the eventual client request.
	 * @returns URL, authorization header, and required request headers for the download call.
	 * @throws If shared-key signing was not configured at startup.
	 */
	public createBlobReadAuthorizationHeader(request: CreateBlobAuthorizationHeaderRequest): Promise<BlobUploadAuthorizationHeader> {
		if (!this.clientUploadSignerInternal) {
			return Promise.reject(new Error('Shared-key signing is not configured; provide signingConnectionString'));
		}
		return this.clientUploadSignerInternal.createBlobReadAuthorizationHeader(request);
	}

	/**
	 * Gets the started `BlobServiceClient` instance.
	 *
	 * This is primarily for framework internals and advanced application adapters.
	 *
	 * @returns The started Azure SDK client.
	 * @throws If the service has not been started.
	 */
	public get blobServiceClient(): BlobServiceClient {
		if (!this.blobServiceClientInternal) {
			throw new Error('ServiceBlobStorage is not started - cannot access blobServiceClient');
		}
		return this.blobServiceClientInternal;
	}

	private getContainerClient(containerName: string) {
		return this.blobServiceClient.getContainerClient(containerName);
	}

	private configureSharedKeySigning(connectionString: string, blobServiceUrl: string): void {
		const accountName = getConnectionStringValue(connectionString, 'AccountName');
		const accountKey = getConnectionStringValue(connectionString, 'AccountKey');
		if (!accountName || !accountKey) {
			throw new Error('signingConnectionString must include both AccountName and AccountKey');
		}
		this.sharedKeyCredentialInternal = new StorageSharedKeyCredential(accountName, accountKey);
		this.clientUploadSignerInternal = new ClientUploadSigner({
			blobServiceUrl,
			accountName,
			accountKey,
		});
	}

}

function isLocalBlobConnectionString(connectionString: string, blobEndpoint: string | undefined): boolean {
	if (/usedevelopmentstorage=true/i.test(connectionString)) {
		return true;
	}

	if (!blobEndpoint) {
		return false;
	}

	try {
		const url = new URL(blobEndpoint);
		return url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]';
	} catch {
		return false;
	}
}
