import { DefaultAzureCredential, type TokenCredential } from '@azure/identity';
import { BlobServiceClient, type BlobUploadCommonResponse } from '@azure/storage-blob';
import type { ServiceBase } from '@cellix/api-services-spec';
import type { BlobAddress, BlobListItem, BlobStorage, CreateBlobSasUrlRequest, CreateContainerSasUrlRequest, ListBlobsRequest, UploadTextBlobRequest } from './blob-storage.contract.ts';
import { ClientUploadSigner } from './client-upload-signer.ts';

/**
 * Options for constructing the framework blob-storage service.
 *
 * @remarks
 * The service supports two distinct modes, controlled by which options are provided:
 *
 * **Mode 1: Connection String (Azurite / Local Dev)**
 * - Provide: `connectionString`
 * - Result: Uses `BlobServiceClient.fromConnectionString()` and enables SAS signing via shared key
 * - Use case: Local development with Azurite, or testing scenarios
 *
 * **Mode 2: Managed Identity (Production)**
 * - Provide: `accountName` (required), optionally `credential` (defaults to `DefaultAzureCredential`)
 * - Result: Constructs URL and uses provided or default token credential for authentication
 * - Use case: Azure-deployed applications with managed identity RBAC
 *
 * **Precedence:**
 * If both `connectionString` and `accountName` are provided, `connectionString` takes precedence
 * and the managed identity path is silently ignored. To avoid surprising behavior, callers should
 * supply only one set of options:
 * - For local dev: provide only `connectionString`
 * - For production: provide only `accountName` (and optionally `credential`)
 */
export interface ServiceBlobStorageOptions {
	/**
	 * Azure Storage connection string for local/dev scenarios (Azurite).
	 *
	 * When provided, takes precedence over `accountName` and `credential`.
	 * If both `connectionString` and `accountName` are supplied, the connection string is used
	 * and managed identity configuration is ignored.
	 *
	 * Example: `'UseDevelopmentStorage=true'` or `'DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...'`
	 */
	connectionString?: string;

	/**
	 * Storage account name for managed identity authentication (production).
	 *
	 * Ignored if `connectionString` is provided. Required when `connectionString` is absent.
	 *
	 * Example: `'myaccount'` → results in URL `https://myaccount.blob.core.windows.net`
	 */
	accountName?: string;

	/**
	 * Optional TokenCredential for managed identity authentication.
	 *
	 * Ignored if `connectionString` is provided. If omitted when using managed identity,
	 * defaults to `DefaultAzureCredential`, which automatically discovers credentials
	 * from the environment (managed identity on Azure, environment variables, local auth, etc.).
	 */
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
