import { DefaultAzureCredential, type TokenCredential } from '@azure/identity';
import { BlobServiceClient, type BlobUploadCommonResponse } from '@azure/storage-blob';
import type { ServiceBase } from '@cellix/api-services-spec';
import type { BlobAddress, BlobListItem, BlobStorage, CreateBlobSasUrlRequest, CreateContainerSasUrlRequest, ListBlobsRequest, UploadTextBlobRequest } from './blob-storage.contract.ts';
import { ClientUploadSigner } from './client-upload-signer.ts';

/**
 * Options for constructing the framework blob-storage service.
 */
export interface ServiceBlobStorageOptions {
	/**
	 * Optional Azure Storage connection string used to build the BlobServiceClient in local/dev scenarios (Azurite)
	 */
	connectionString?: string;

	/**
	 * Optional storage account name; used to build service URL when using TokenCredential (managed identity) for backend ops.
	 */
	accountName?: string;

	/**
	 * Optional TokenCredential to use for managed identity authentication. If not provided, DefaultAzureCredential will be used.
	 */
	credential?: TokenCredential;
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
	private connectionString: string | undefined;
	private accountName: string | undefined;
	private credential: TokenCredential | undefined;
	private blobServiceClientInternal: BlobServiceClient | undefined;
	private clientUploadSignerInternal: ClientUploadSigner | undefined;

	constructor(options: ServiceBlobStorageOptions) {
		this.connectionString = options.connectionString;
		this.accountName = options.accountName;
		this.credential = options.credential;

		if (!this.connectionString && !this.accountName) {
			throw new Error('Either connectionString (for local dev) or accountName (for managed identity) must be provided');
		}
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
