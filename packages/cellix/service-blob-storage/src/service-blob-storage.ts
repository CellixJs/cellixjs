import { BlobSASPermissions, BlobServiceClient, type BlobUploadCommonResponse, ContainerSASPermissions, generateBlobSASQueryParameters, type StorageSharedKeyCredential } from '@azure/storage-blob';
import type { ServiceBase } from '@cellix/api-services-spec';
import type { BlobAddress, BlobListItem, BlobStorage, CreateBlobSasUrlRequest, CreateContainerSasUrlRequest, ListBlobsRequest, UploadTextBlobRequest } from './blob-storage.contract.ts';
import { createCredentialFromConnectionString } from './connection-string.ts';

/**
 * Options for constructing the framework blob-storage service.
 */
export interface ServiceBlobStorageOptions {
	/**
	 * Azure Storage connection string used to build the BlobServiceClient.
	 */
	connectionString: string;
}

/**
 * Azure Blob Storage infrastructure service for Cellix bootstraps.
 *
 * The service keeps Azure SDK usage and shared-key parsing inside the framework package
 * while exposing a small contract of blob operations and SAS URL creation.
 *
 * @returns A started {@link BlobStorage} contract when {@link startUp} is called.
 *
 * @example
 * ```ts
 * const blobStorage = new ServiceBlobStorage({
 *   connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
 * });
 *
 * await blobStorage.startUp();
 *
 * const uploadUrl = await blobStorage.createBlobWriteSasUrl({
 *   containerName: 'member-assets',
 *   blobName: 'avatars/member-123.png',
 *   expiresOn: new Date(Date.now() + 5 * 60_000),
 * });
 * ```
 */
export class ServiceBlobStorage implements ServiceBase<BlobStorage>, BlobStorage {
	private readonly connectionString: string;
	private blobServiceClientInternal: BlobServiceClient | undefined;
	private sharedKeyCredentialInternal: StorageSharedKeyCredential | undefined;

	constructor(options: ServiceBlobStorageOptions) {
		if (!options.connectionString.trim()) {
			throw new Error('Blob Storage connection string is required');
		}
		this.connectionString = options.connectionString;
	}

	public startUp(): Promise<BlobStorage> {
		this.blobServiceClientInternal = BlobServiceClient.fromConnectionString(this.connectionString);
		this.sharedKeyCredentialInternal = createCredentialFromConnectionString(this.connectionString);
		return Promise.resolve(this);
	}

	public shutDown(): Promise<void> {
		if (!this.blobServiceClientInternal) {
			return Promise.reject(new Error('ServiceBlobStorage is not started - shutdown cannot proceed'));
		}

		this.blobServiceClientInternal = undefined;
		this.sharedKeyCredentialInternal = undefined;
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
		return Promise.resolve(this.createBlobSasUrl(request, BlobSASPermissions.parse('r')));
	}

	public createBlobWriteSasUrl(request: CreateBlobSasUrlRequest): Promise<string> {
		return Promise.resolve(this.createBlobSasUrl(request, BlobSASPermissions.parse('cw')));
	}

	public createContainerListSasUrl(request: CreateContainerSasUrlRequest): Promise<string> {
		const containerClient = this.getContainerClient(request.containerName);
		const sas = generateBlobSASQueryParameters(
			{
				containerName: request.containerName,
				expiresOn: request.expiresOn,
				permissions: ContainerSASPermissions.parse('rl'),
			},
			this.getSharedKeyCredential(),
		).toString();
		return Promise.resolve(`${containerClient.url}?${sas}`);
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

	private getSharedKeyCredential(): StorageSharedKeyCredential {
		if (!this.sharedKeyCredentialInternal) {
			throw new Error('ServiceBlobStorage is not started - cannot access SAS credential');
		}
		return this.sharedKeyCredentialInternal;
	}

	private createBlobSasUrl(request: CreateBlobSasUrlRequest, permissions: BlobSASPermissions): string {
		const blobClient = this.getContainerClient(request.containerName).getBlockBlobClient(request.blobName);
		const sas = generateBlobSASQueryParameters(
			{
				containerName: request.containerName,
				blobName: request.blobName,
				expiresOn: request.expiresOn,
				permissions,
			},
			this.getSharedKeyCredential(),
		).toString();

		return `${blobClient.url}?${sas}`;
	}
}
