import type { ServiceBase } from '@cellix/api-services-spec';
import { ServiceBlobStorage as CellixServiceBlobStorage, type ServiceBlobStorageOptions as CellixServiceBlobStorageOptions } from '@cellix/service-blob-storage';
import type { BlobStorage, CreateBlobAccessUrlRequest } from './blob-storage.contract.ts';
import { createBlobStorage } from './blob-storage-adapter.ts';

export interface ServiceBlobStorageOptions extends CellixServiceBlobStorageOptions {
	frameworkService?: CellixServiceBlobStorage;
}

export class ServiceBlobStorage implements ServiceBase<BlobStorage>, BlobStorage {
	private readonly frameworkService: CellixServiceBlobStorage;
	private serviceInternal: BlobStorage | undefined;

	constructor(options: ServiceBlobStorageOptions) {
		this.frameworkService = options.frameworkService ?? new CellixServiceBlobStorage({ connectionString: options.connectionString });
	}

	public async startUp(): Promise<BlobStorage> {
		const frameworkBlobStorage = await this.frameworkService.startUp();
		this.serviceInternal = createBlobStorage(frameworkBlobStorage);
		return this;
	}

	public async shutDown(): Promise<void> {
		if (!this.serviceInternal) {
			throw new Error('ServiceBlobStorage is not started - shutdown cannot proceed');
		}

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
