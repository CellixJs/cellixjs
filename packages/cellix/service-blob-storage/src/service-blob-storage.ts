import { DefaultAzureCredential, type TokenCredential } from '@azure/identity';
import { BlobServiceClient, type BlobUploadCommonResponse } from '@azure/storage-blob';
import type { ServiceBase } from '@cellix/api-services-spec';
import type { BlobAddress, BlobListItem, BlobStorage, CreateBlobSasUrlRequest, CreateContainerSasUrlRequest, ListBlobsRequest, UploadTextBlobRequest } from './blob-storage.contract.ts';
import { ClientUploadSigner } from './client-upload-signer.ts';

/**
 * Options for constructing the framework blob-storage service.
 *
 * The service supports two authentication modes:
 * - connectionString: use a full Azure Storage connection string (local/dev, Azurite). When provided,
 *   the connection string takes precedence and the managed identity path is ignored.
 * - managedIdentity: use accountName with a TokenCredential (DefaultAzureCredential) for SDK operations.
 *
 * Provide exactly one of `connectionString` or `accountName` to avoid surprising precedence behavior.
 *
 * @property connectionString - Azure Storage connection string (takes precedence when present).
 * @property accountName - Storage account name for managed identity authentication (required if connectionString is absent).
 * @property credential - Optional TokenCredential for managed identity auth (defaults to DefaultAzureCredential).
 */
export interface ServiceBlobStorageOptions {
	connectionString?: string;
	accountName?: string;
	credential?: TokenCredential;
}

/**
 * Determines the authentication mode based on provided options and validates mutual exclusivity.
 *
 * @param options - The service options to analyze
 * @returns The determined mode: `'connectionString'` or `'managedIdentity'`
 * @throws If configuration is invalid (e.g., missing required options for the determined mode)
 *
 * @remarks
 * This helper centralizes the logic for determining which authentication path will be used.
 * When both `connectionString` and `accountName` are provided, connection string takes precedence
 * (though this is somewhat undesirable from a UX perspective, the helper documents this clearly).
 */
function determineAuthMode(options: ServiceBlobStorageOptions): 'connectionString' | 'managedIdentity' {
	if (options.connectionString) {
		return 'connectionString';
	}
	if (options.accountName) {
		return 'managedIdentity';
	}
	throw new Error('Either connectionString (for local dev) or accountName (for managed identity) must be provided');
}

/**
 * Azure Blob Storage infrastructure service for Cellix bootstraps.
 *
 * The service keeps Azure SDK usage and shared-key parsing inside the framework package
 * while exposing a small contract of blob operations and SAS URL creation.
 *
 * It supports two modes:
 * - connectionString present: uses BlobServiceClient.fromConnectionString (Azurite/local dev) and enables SAS signing via shared-key
 * - connectionString absent: uses DefaultAzureCredential (or provided credential) and accountName to build a TokenCredential-backed client
 *
 */
export class ServiceBlobStorage implements ServiceBase<BlobStorage>, BlobStorage {
	private readonly connectionString: string | undefined;
	private readonly accountName: string | undefined;
	private readonly credential: TokenCredential | undefined;
	private blobServiceClientInternal: BlobServiceClient | undefined;
	private clientUploadSignerInternal: ClientUploadSigner | undefined;

	constructor(options: ServiceBlobStorageOptions) {
		this.connectionString = options.connectionString;
		this.accountName = options.accountName;
		this.credential = options.credential;

		// Validate that the configuration is valid by determining the auth mode
		determineAuthMode(options);
	}

	public startUp(): Promise<BlobStorage> {
		// If a connection string is present (Azurite/local dev), use it for the BlobServiceClient
		if (this.connectionString) {
			this.blobServiceClientInternal = BlobServiceClient.fromConnectionString(this.connectionString);
			this.clientUploadSignerInternal = new ClientUploadSigner(this.connectionString);
			return Promise.resolve(this);
		}

		// Managed identity flow: construct URL from accountName and use DefaultAzureCredential unless a credential is provided
		if (!this.accountName) {
			throw new Error('accountName is required when connectionString is not provided');
		}
		const credentialToUse = this.credential ?? new DefaultAzureCredential();
		const url = `https://${this.accountName}.blob.core.windows.net`;
		this.blobServiceClientInternal = new BlobServiceClient(url, credentialToUse);
		// No shared key in this flow; signer must be constructed only if connectionString present
		return Promise.resolve(this);
	}

	public shutDown(): Promise<void> {
		// Make shutdown idempotent: resolving when not started is OK.
		if (!this.blobServiceClientInternal) {
			return Promise.resolve();
		}

		this.blobServiceClientInternal = undefined;
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

	public createBlobReadSasUrl(request: CreateBlobSasUrlRequest): Promise<string> {
		// Delegate to signer if available
		if (!this.clientUploadSignerInternal) {
			return Promise.reject(new Error('SAS generation requires a connection string - not configured'));
		}
		return this.clientUploadSignerInternal.createBlobReadSasUrl(request);
	}

	public createBlobWriteSasUrl(request: CreateBlobSasUrlRequest): Promise<string> {
		if (!this.clientUploadSignerInternal) {
			return Promise.reject(new Error('SAS generation requires a connection string - not configured'));
		}
		return this.clientUploadSignerInternal.createBlobWriteSasUrl(request);
	}

	public createContainerListSasUrl(request: CreateContainerSasUrlRequest): Promise<string> {
		if (!this.clientUploadSignerInternal) {
			return Promise.reject(new Error('SAS generation requires a connection string - not configured'));
		}
		return this.clientUploadSignerInternal.createContainerListSasUrl(request);
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
