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
 * The constructor now infers the authentication mode from the provided properties:
 * - { connectionString } (only): use shared-key / connection string flow (SAS signing available)
 * - { accountName, credential? } (only): use managed identity flow (TokenCredential)
 *
 * Provide exactly one of `connectionString` or `accountName`. Passing both or neither
 * will throw a clear Error.
 */
export type ServiceBlobStorageOptions = {
	connectionString?: string;
	accountName?: string;
	credential?: TokenCredential;
	provisionContainers?: string[];
};

/**
 * Validates the provided options at construction time and infers the auth mode.
 * Throws a clear Error if both or neither of `connectionString` and `accountName` are provided.
 */
function validateOptions(options: ServiceBlobStorageOptions): void {
	const hasConnectionString = !!options.connectionString?.trim();
	const hasAccountName = !!options.accountName?.trim();

	if (hasConnectionString === hasAccountName) {
		throw new Error("Provide either 'connectionString' (for shared-key) or 'accountName' (for managed identity), but not both");
	}
}

/**
 * Azure Blob Storage infrastructure service for Cellix bootstraps.
 *
 * The service keeps Azure SDK usage and shared-key parsing inside the framework package
 * while exposing a small contract of blob operations and SAS URL creation.
 *
 * Runtime behavior is unchanged: the connection-string path creates a StorageSharedKeyCredential
 * and a ClientUploadSigner for SAS/authorization header generation; the managed-identity path
 * constructs a TokenCredential-backed BlobServiceClient.
 */
export class ServiceBlobStorage implements ServiceBase<BlobStorage>, BlobStorage {
	private readonly options: ServiceBlobStorageOptions;
	private inferredMode: 'sharedKey' | 'managedIdentity';
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
			this.blobServiceClientInternal = BlobServiceClient.fromConnectionString(this.options.connectionString as string);

			// Extract shared key credential for SAS generation
			const accountName = getConnectionStringValue(this.options.connectionString as string, 'AccountName');
			const accountKey = getConnectionStringValue(this.options.connectionString as string, 'AccountKey');
			if (accountName && accountKey) {
				this.sharedKeyCredentialInternal = new StorageSharedKeyCredential(accountName, accountKey);
			}

			// Create signer for shared-key signing
			this.clientUploadSignerInternal = new ClientUploadSigner(this.options.connectionString as string);

			const endpoint = this.blobServiceClientInternal?.url ?? '(unknown)';
			const maskedAccount = accountName ? accountName.replace(/.(?=.{4})/g, '*') : 'unknown';
			console.info(`[ServiceBlobStorage] started (sharedKey). endpoint=${endpoint}, account=${maskedAccount}`);

			const conn = this.options.connectionString as string;
			const isAzuriteConnection = conn.includes('UseDevelopmentStorage=true') || conn.includes('127.0.0.1');
			const nodeEnv = (process.env as { NODE_ENV?: string }).NODE_ENV;
			if (nodeEnv === 'development' || isAzuriteConnection) {
				if (Array.isArray(this.options.provisionContainers)) {
					for (const container of this.options.provisionContainers) {
						try {
							await this.createContainerIfNotExists(container);
						} catch (error) {
							console.warn('[ServiceBlobStorage] failed to auto-provision container', container, error);
						}
					}
				}
			}

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
			return Promise.reject(new Error('SAS token generation requires a connection string with AccountKey - not configured'));
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
	 * Only available when the service was constructed in 'sharedKey' mode.
	 */
	public createBlobWriteAuthorizationHeader(request: CreateBlobAuthorizationHeaderRequest): Promise<BlobUploadAuthorizationHeader> {
		if (this.inferredMode !== 'sharedKey' || !this.clientUploadSignerInternal) {
			return Promise.reject(new Error('Instance not configured for shared-key signing; construct ServiceBlobStorage with { connectionString }'));
		}
		return this.clientUploadSignerInternal.createBlobWriteAuthorizationHeader(request);
	}

	/**
	 * Create signed authorization header for client-side blob read (GET) requests.
	 * Only available when the service was constructed in 'sharedKey' mode.
	 */
	public createBlobReadAuthorizationHeader(request: CreateBlobAuthorizationHeaderRequest): Promise<BlobUploadAuthorizationHeader> {
		if (this.inferredMode !== 'sharedKey' || !this.clientUploadSignerInternal) {
			return Promise.reject(new Error('Instance not configured for shared-key signing; construct ServiceBlobStorage with { connectionString }'));
		}
		return this.clientUploadSignerInternal.createBlobReadAuthorizationHeader(request);
	}

	/**
	 * Backwards-compatible aliases matching the narrow ClientUploadService contract.
	 * These delegate to the framework method names but allow structural assignment
	 * to the ClientUploadService interface without requiring casts.
	 */
	public createUploadUrl(request: CreateBlobAuthorizationHeaderRequest): Promise<BlobUploadAuthorizationHeader> {
		return this.createBlobWriteAuthorizationHeader(request);
	}

	public createReadUrl(request: CreateBlobAuthorizationHeaderRequest): Promise<BlobUploadAuthorizationHeader> {
		return this.createBlobReadAuthorizationHeader(request);
	}

	public async createContainerIfNotExists(containerName: string): Promise<void> {
		try {
			await this.getContainerClient(containerName).createIfNotExists();
		} catch (error) {
			console.warn('[ServiceBlobStorage] createContainerIfNotExists failed for', containerName, error);
		}
	}

	/**
	 * Gets the started BlobServiceClient instance.
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
}
