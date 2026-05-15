import type { ServiceBase } from '@cellix/api-services-spec';
import { ServiceBlobStorage as CellixServiceBlobStorage, type ServiceBlobStorageOptions as CellixServiceBlobStorageOptions } from '@cellix/service-blob-storage';
import type { BlobStorage, CreateBlobAccessUrlRequest } from './blob-storage.contract.ts';
import { createBlobStorage } from './blob-storage-adapter.ts';

/**
 * Options for the OCOM blob storage service wrapper.
 *
 * Supports two deployment scenarios:
 * 1. Server-only blob operations: provide only accountName (managed identity auth)
 * 2. Client uploads with SAS signing: provide both accountName and connectionString
 *
 * The wrapper uses only accountName for SDK authentication (via managed identity / DefaultAzureCredential).
 * The connectionString is available for consumers that need it (e.g., SAS token generation for client uploads).
 */
export interface ServiceBlobStorageOptions {
	/**
	 * Storage account name. Required for blob URL construction and used by managed identity for authentication.
	 */
	accountName: string | undefined;

	/**
	 * Optional Azure Storage connection string.
	 * Only required if the application implements client uploads with SAS token signing.
	 * Not used by the service for authentication; managed identity is always used.
	 * Available for consumers that need it (e.g., SAS token generation).
	 */
	connectionString?: string | undefined;

	/**
	 * Optional framework service instance. If not provided, one will be created using only the accountName.
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
			// Always use only accountName for SDK authentication (managed identity)
			// Connection string is not used for SDK auth, only for SAS signing in consumers
			const frameworkOptions: CellixServiceBlobStorageOptions = {};
			if (options.accountName) {
				frameworkOptions.accountName = options.accountName;
			}
			this.frameworkService = new CellixServiceBlobStorage(frameworkOptions);
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
