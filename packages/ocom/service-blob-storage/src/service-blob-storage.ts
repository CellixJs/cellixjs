import type { ServiceBase } from '@cellix/api-services-spec';
import { ServiceBlobStorage as CellixServiceBlobStorage } from '@cellix/service-blob-storage';
import type { BlobStorage, CreateBlobAccessUrlRequest } from './blob-storage.contract.ts';
import { createBlobStorage } from './blob-storage-adapter.ts';

/**
 * Options for the OCOM blob storage service wrapper.
 *
 * Supports two deployment scenarios:
 * 1. Server-only blob operations: provide only accountName (managed identity auth)
 * 2. Client uploads with SAS signing: provide both accountName and connectionString
 *
 * Both values are passed through to the framework ServiceBlobStorage, which determines
 * the authentication mode based on what is provided:
 * - If connectionString is provided: uses shared key auth (for Azurite or when shared-key signing is needed)
 * - If only accountName is provided: uses managed identity (DefaultAzureCredential)
 */
export interface ServiceBlobStorageOptions {
	/**
	 * Storage account name. Required for blob URL construction and managed identity authentication.
	 */
	accountName: string | undefined;

	/**
	 * Optional Azure Storage connection string.
	 * Only required if the application implements client uploads with SAS token signing.
	 * When provided, passed to the framework service to enable shared-key SAS generation.
	 * When omitted, the service uses managed identity (DefaultAzureCredential) for authentication.
	 */
	connectionString?: string | undefined;

	/**
	 * Optional framework service instance. If not provided, one will be created using the provided options.
	 */
	frameworkService?: CellixServiceBlobStorage;
}

export class ServiceBlobStorage implements ServiceBase<BlobStorage>, BlobStorage {
	private readonly frameworkService: CellixServiceBlobStorage;
	private serviceInternal: BlobStorage | undefined;

	constructor(options: ServiceBlobStorageOptions) {
		if (options.frameworkService) {
			this.frameworkService = options.frameworkService;
		} else {
			this.frameworkService = new CellixServiceBlobStorage({
				...(options.accountName !== undefined && { accountName: options.accountName }),
				...(options.connectionString !== undefined && { connectionString: options.connectionString }),
			});
		}
	}

	public async startUp(): Promise<BlobStorage> {
		const frameworkBlobStorage = await this.frameworkService.startUp();
		this.serviceInternal = createBlobStorage(frameworkBlobStorage);
		return this;
	}

	public async shutDown(): Promise<void> {
		// Allow shutDown to be called even if the adapter wasn't started.
		// Rely on the framework service to be idempotent when shutting down.
		this.serviceInternal = undefined;
		await this.frameworkService.shutDown();
	}

	public async createUploadUrl(request: CreateBlobAccessUrlRequest): Promise<string> {
		return await this.getService().createUploadUrl(request);
	}

	public async createReadUrl(request: CreateBlobAccessUrlRequest): Promise<string> {
		return await this.getService().createReadUrl(request);
	}

	private getService(): BlobStorage {
		if (!this.serviceInternal) {
			throw new Error('ServiceBlobStorage is not started - cannot access service');
		}
		return this.serviceInternal;
	}
}
