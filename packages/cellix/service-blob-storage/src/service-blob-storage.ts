import { DefaultAzureCredential, type TokenCredential } from '@azure/identity';
import { BlobServiceClient, type BlobUploadCommonResponse } from '@azure/storage-blob';
import type { ServiceBase } from '@cellix/api-services-spec';
import type {
	BlobAddress,
	BlobListItem,
	BlobProperties,
	BlobStorage,
	CreateContainerRequest,
	DownloadBlobToFileRequest,
	ListBlobsRequest,
	ServiceBlobStorageOptions,
	UploadFileBlobRequest,
	UploadTextBlobRequest,
} from './interfaces.ts';

function validateOptions(options: ServiceBlobStorageOptions): void {
	if (!options.accountName?.trim()) {
		throw new Error("Provide an 'accountName' for blob client authentication");
	}
}

export class ServiceBlobStorage implements ServiceBase<BlobStorage>, BlobStorage {
	protected readonly options: ServiceBlobStorageOptions;
	private blobServiceClientInternal: BlobServiceClient | undefined;

	constructor(options: ServiceBlobStorageOptions) {
		validateOptions(options);
		this.options = options;
	}

	public async startUp(): Promise<BlobStorage> {
		await Promise.resolve();

		const { accountName, credential } = this.options;
		const credentialToUse: TokenCredential = credential ?? new DefaultAzureCredential();
		const url = `https://${accountName}.blob.core.windows.net`;

		this.blobServiceClientInternal = new BlobServiceClient(url, credentialToUse);
		console.info(`[ServiceBlobStorage] started (managedIdentity). account=${accountName}, endpoint=${url}`);
		return this;
	}

	public shutDown(): Promise<void> {
		if (!this.blobServiceClientInternal) {
			return Promise.resolve();
		}

		this.blobServiceClientInternal = undefined;
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

	public async uploadFile(request: UploadFileBlobRequest): Promise<BlobUploadCommonResponse> {
		const blockBlobClient = this.getContainerClient(request.containerName).getBlockBlobClient(request.blobName);
		return await blockBlobClient.uploadFile(request.filePath, {
			...(request.httpHeaders ? { blobHTTPHeaders: request.httpHeaders } : {}),
			...(request.metadata ? { metadata: request.metadata } : {}),
			...(request.tags ? { tags: request.tags } : {}),
			...(request.abortSignal ? { abortSignal: request.abortSignal } : {}),
		});
	}

	public async downloadToFile(request: DownloadBlobToFileRequest): Promise<void> {
		const blockBlobClient = this.getContainerClient(request.containerName).getBlockBlobClient(request.blobName);
		await blockBlobClient.downloadToFile(request.filePath, 0, undefined, request.abortSignal ? { abortSignal: request.abortSignal } : undefined);
	}

	public async createContainerIfNotExists(request: CreateContainerRequest): Promise<void> {
		await this.getContainerClient(request.containerName).createIfNotExists();
	}

	public async getBlobProperties(address: BlobAddress): Promise<BlobProperties | null> {
		const blockBlobClient = this.getContainerClient(address.containerName).getBlockBlobClient(address.blobName);
		try {
			const properties = await blockBlobClient.getProperties();
			return {
				contentLength: properties.contentLength ?? 0,
				contentType: properties.contentType,
				lastModified: properties.lastModified,
				metadata: properties.metadata ?? {},
			};
		} catch (error) {
			if ((error as { statusCode?: unknown } | null)?.statusCode === 404) {
				return null;
			}
			throw error;
		}
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

	protected setBlobServiceClient(client: BlobServiceClient): void {
		this.blobServiceClientInternal = client;
	}

	protected getContainerClient(containerName: string) {
		return this.requireBlobServiceClient().getContainerClient(containerName);
	}

	protected getBlobServiceUrl(): string {
		return this.requireBlobServiceClient().url;
	}

	private requireBlobServiceClient(): BlobServiceClient {
		if (!this.blobServiceClientInternal) {
			throw new Error('ServiceBlobStorage is not started - cannot access blob operations');
		}
		return this.blobServiceClientInternal;
	}
}
