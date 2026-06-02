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
 * - `{ connectionString }`: use connection-string / shared-key auth for blob SDK operations
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
type SharedKeyBlobClientOptions = {
	connectionString: string;
	accountName?: never;
	credential?: never;
	signingConnectionString?: string;
};

type ManagedIdentityBlobClientOptions = {
	accountName: string;
	credential?: TokenCredential;
	connectionString?: never;
	signingConnectionString?: string;
};

export type ServiceBlobStorageOptions = SharedKeyBlobClientOptions | ManagedIdentityBlobClientOptions;

/**
 * Validates the provided options at construction time and infers the blob SDK auth mode.
 */
function validateOptions(options: ServiceBlobStorageOptions): void {
	const hasConnectionString = 'connectionString' in options && !!options.connectionString?.trim();
	const hasAccountName = 'accountName' in options && !!options.accountName?.trim();

	if (hasConnectionString === hasAccountName) {
		throw new Error("Provide exactly one blob client authentication strategy: either 'connectionString' or 'accountName'");
	}

	if ('signingConnectionString' in options && typeof options.signingConnectionString === 'string' && !options.signingConnectionString.trim()) {
		throw new Error("'signingConnectionString' must be a non-empty string when provided");
	}
}

/**
 * Azure Blob Storage infrastructure service for Cellix bootstraps.
 *
 * The service keeps Azure SDK usage and shared-key parsing inside the framework package
 * while exposing a small framework-native contract of blob operations and blob-scoped signing.
 *
 * Runtime behavior is split intentionally:
 * - blob operations authenticate through either connection string or managed identity
 * - shared-key signing is available only when explicitly configured
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
	private readonly inferredMode: 'sharedKey' | 'managedIdentity';
	private blobServiceClientInternal: BlobServiceClient | undefined;
	private sharedKeyCredentialInternal: StorageSharedKeyCredential | undefined;
	private clientUploadSignerInternal: ClientUploadSigner | undefined;

	constructor(options: ServiceBlobStorageOptions) {
		validateOptions(options);
		this.options = options;
		this.inferredMode = options.connectionString ? 'sharedKey' : 'managedIdentity';
	}

	public async startUp(): Promise<BlobStorage> {
		// Avoid startup-time IMDS probes in environments without managed identity by deferring
		// token acquisition to the Azure SDK. Keep function async and include a no-op await
		// to satisfy the linter which enforces at least one await in async functions.
		await Promise.resolve();

		if (this.inferredMode === 'sharedKey') {
			// connection string path
			const connectionString = this.options.connectionString as string;
			this.blobServiceClientInternal = BlobServiceClient.fromConnectionString(connectionString);
			this.configureSharedKeySigning(this.options.signingConnectionString ?? connectionString, this.blobServiceClientInternal.url);

			const endpoint = this.blobServiceClientInternal?.url ?? '(unknown)';
			const accountName = getConnectionStringValue(connectionString, 'AccountName');
			const maskedAccount = accountName ? accountName.replace(/.(?=.{4})/g, '*') : 'unknown';
			console.info(`[ServiceBlobStorage] started (sharedKey). endpoint=${endpoint}, account=${maskedAccount}`);

			return this;
		}

		// managed identity flow
		const accountName = this.options.accountName as string;
		const credentialToUse: TokenCredential = this.options.credential ?? new DefaultAzureCredential();
		const url = `https://${accountName}.blob.core.windows.net`;

		// Construct the client and defer token acquisition to the SDK. This avoids
		// startup-time hangs when IMDS isn't available (local dev). Operations will
		// fail at call time if the environment doesn't provide a valid managed identity.
		this.blobServiceClientInternal = new BlobServiceClient(url, credentialToUse);
		if (this.options.signingConnectionString) {
			this.configureSharedKeySigning(this.options.signingConnectionString, this.blobServiceClientInternal.url);
		}
		console.info(`[ServiceBlobStorage] started (managedIdentity). account=${accountName}, endpoint=${url}`);
		return this;
	}

	public shutDown(): Promise<void> {
		// Make shutdown idempotent: resolving when not started is OK.
		if (!this.blobServiceClientInternal) {
			return Promise.resolve();
		}

		this.blobServiceClientInternal = undefined;
		this.sharedKeyCredentialInternal = undefined;
		this.clientUploadSignerInternal = undefined;
		return Promise.resolve();
	}

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

	public async deleteBlob(address: BlobAddress): Promise<void> {
		await this.getContainerClient(address.containerName).deleteBlob(address.blobName);
	}

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

	public generateReadSasToken(request: CreateBlobSasUrlRequest): Promise<string> {
		if (!this.sharedKeyCredentialInternal) {
			return Promise.reject(new Error('Shared-key signing is not configured; provide signingConnectionString or use connectionString-based blob client configuration'));
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
	 * Create signed authorization header for client-side blob write (PUT) requests.
	 * Only available when shared-key signing capability is configured.
	 */
	public createBlobWriteAuthorizationHeader(request: CreateBlobAuthorizationHeaderRequest): Promise<BlobUploadAuthorizationHeader> {
		if (!this.clientUploadSignerInternal) {
			return Promise.reject(new Error('Shared-key signing is not configured; provide signingConnectionString or use connectionString-based blob client configuration'));
		}
		return this.clientUploadSignerInternal.createBlobWriteAuthorizationHeader(request);
	}

	/**
	 * Create signed authorization header for client-side blob read (GET) requests.
	 * Only available when shared-key signing capability is configured.
	 */
	public createBlobReadAuthorizationHeader(request: CreateBlobAuthorizationHeaderRequest): Promise<BlobUploadAuthorizationHeader> {
		if (!this.clientUploadSignerInternal) {
			return Promise.reject(new Error('Shared-key signing is not configured; provide signingConnectionString or use connectionString-based blob client configuration'));
		}
		return this.clientUploadSignerInternal.createBlobReadAuthorizationHeader(request);
	}

	/**
	 * Gets the started `BlobServiceClient` instance.
	 *
	 * Throws if the service has not been started.
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
