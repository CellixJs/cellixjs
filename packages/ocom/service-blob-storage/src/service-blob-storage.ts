import type { ServiceBase } from '@cellix/api-services-spec';
import { ServiceBlobStorage as CellixServiceBlobStorage } from '@cellix/service-blob-storage';
import type { BlobStorage, CreateBlobAccessUrlRequest } from './blob-storage.contract.ts';
import { createBlobStorage } from './blob-storage-adapter.ts';

/**
 * Options for the OCOM blob storage service wrapper.
 *
 * Supports two deployment scenarios:
 * 1. Server-only blob operations: provide only accountName (managed identity auth)
 * 2. Client uploads with SAS signing: provide connectionString for the separate signing service
 *
 * @remarks
 * The adapter uses two separate framework services internally for clean separation of concerns:
 * - **SDK service**: Uses accountName + managed identity for all blob operations (read/write/delete)
 * - **SAS signing service**: Uses connectionString for generating signed SAS URLs (if connectionString provided)
 *
 * This ensures:
 * - Managed identity is used for SDK operations (production best practice)
 * - Shared-key credentials are only used for SAS URL generation (not for blob operations)
 * - Each service has a single, clear responsibility
 */
export interface ServiceBlobStorageOptions {
	/**
	 * Storage account name. Required for blob URL construction and managed identity authentication.
	 * Used by the SDK service for all blob operations.
	 */
	accountName: string;

	/**
	 * Optional Azure Storage connection string for SAS token signing.
	 *
	 * @remarks
	 * When provided, a separate framework service is configured for SAS URL generation.
	 * The SDK operations still use managed identity (via accountName).
	 * Only required if the application needs client uploads with signed SAS URLs.
	 * When omitted, SAS methods throw a clear error indicating the feature is not configured.
	 */
	connectionString?: string;

	/**
	 * Optional framework service instance for testing/injection.
	 * If not provided, a service will be created using accountName + managed identity.
	 * This is for the SDK operations service; see connectionString for SAS signing configuration.
	 */
	frameworkService?: CellixServiceBlobStorage;
}

export class ServiceBlobStorage implements ServiceBase<BlobStorage>, BlobStorage {
	private readonly sdkService: CellixServiceBlobStorage;
	private readonly sasSigningService: CellixServiceBlobStorage | undefined;
	private serviceInternal: BlobStorage | undefined;

	constructor(options: ServiceBlobStorageOptions) {
		// SDK service: always uses managed identity (accountName only)
		if (options.frameworkService) {
			this.sdkService = options.frameworkService;
		} else {
			this.sdkService = new CellixServiceBlobStorage({
				accountName: options.accountName,
			});
		}

		// SAS signing service: only if connection string provided
		if (options.connectionString) {
			this.sasSigningService = new CellixServiceBlobStorage({
				connectionString: options.connectionString,
			});
		}
	}

	public async startUp(): Promise<BlobStorage> {
		const sdkBlobStorage = await this.sdkService.startUp();
		const sasBlobStorage = this.sasSigningService ? await this.sasSigningService.startUp() : undefined;
		this.serviceInternal = createBlobStorage(sdkBlobStorage, sasBlobStorage);
		return this;
	}

	public async shutDown(): Promise<void> {
		// Allow shutDown to be called even if the adapter wasn't started.
		// Both framework services are idempotent when shutting down.
		this.serviceInternal = undefined;
		await this.sdkService.shutDown();
		if (this.sasSigningService) {
			await this.sasSigningService.shutDown();
		}
	}

	public async createUploadUrl(request: CreateBlobAccessUrlRequest): Promise<string> {
		return await this.getService().createUploadUrl(request);
	}

	public async createReadUrl(request: CreateBlobAccessUrlRequest): Promise<string> {
		return await this.getService().createReadUrl(request);
	}

	private getService(): BlobStorage {
		if (!this.serviceInternal) {
			throw new Error('OCOM ServiceBlobStorage adapter is not started - cannot access service');
		}
		return this.serviceInternal;
	}
}
