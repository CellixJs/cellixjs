import type { ServiceBase } from '@cellix/api-services-spec';
import type { BlobStorage as CellixBlobStorage, ListBlobsRequest, UploadTextBlobRequest } from '@cellix/service-blob-storage';
import type { BlobStorage, CreateBlobAccessUrlRequest } from './blob-storage.contract.ts';

/**
 * Options for the OCOM blob storage service wrapper.
 *
 * Accepts two pre-configured framework services registered separately in apps/api:
 * 1. **sdkService** (required): Uses accountName + managed identity for blob operations (listBlobs/uploadText/deleteBlob)
 * 2. **sasSigningService** (optional): Uses connectionString for generating signed SAS URLs (createUploadUrl/createReadUrl)
 *
 * The adapter orchestrates these two services and exposes a unified BlobStorage contract
 * for application use, including both backend operations (listBlobs, uploadText, deleteBlob)
 * and client-upload SAS methods (createUploadUrl, createReadUrl).
 *
 * @example
 * ```typescript
 * // In apps/api, register two services separately:
 * const blobStorageService = new ServiceBlobStorage({
 *   accountName: 'myaccount',  // Managed identity
 * });
 * const clientUploadService = new ServiceBlobStorage({
 *   connectionString: process.env['AZURE_STORAGE_CONNECTION_STRING'],
 * });
 *
 * cellix.registerInfrastructureService(blobStorageService, { name: 'blobStorageService' });
 * cellix.registerInfrastructureService(clientUploadService, { name: 'clientUploadService' });
 *
 * // In OCOM adapter:
 * const adapter = new ServiceBlobStorage({
 *   sdkService: serviceRegistry.getInfrastructureService<CellixBlobStorage>('blobStorageService'),
 *   sasSigningService: serviceRegistry.getInfrastructureService<CellixBlobStorage>('clientUploadService'),
 * });
 * ```
 */
export interface ServiceBlobStorageOptions {
	/**
	 * Framework service for SDK blob operations (listBlobs, uploadText, deleteBlob).
	 * Must be configured with accountName + managed identity (no connectionString).
	 * Registered in apps/api as 'blobStorageService'.
	 */
	sdkService: CellixBlobStorage;

	/**
	 * Optional framework service for SAS URL generation (createUploadUrl, createReadUrl).
	 * Must be configured with connectionString.
	 * Only required if the application needs client uploads with signed SAS URLs.
	 * Registered in apps/api as 'clientUploadService'.
	 */
	sasSigningService?: CellixBlobStorage;
}

export class ServiceBlobStorage implements ServiceBase<BlobStorage>, BlobStorage {
	private readonly sdkService: CellixBlobStorage;
	private readonly sasSigningService: CellixBlobStorage | undefined;

	constructor(options: ServiceBlobStorageOptions) {
		this.sdkService = options.sdkService;
		this.sasSigningService = options.sasSigningService;
	}

	public startUp(): Promise<BlobStorage> {
		// Framework services are started separately at the app level
		// This method is required by ServiceBase contract but is a no-op here
		return Promise.resolve(this);
	}

	public shutDown(): Promise<void> {
		// Framework services are managed separately at the app level
		// This method is required by ServiceBase contract but is a no-op here
		return Promise.resolve();
	}

	public async listBlobs(containerName: string): Promise<string[]> {
		const request: ListBlobsRequest = { containerName };
		const items = await this.sdkService.listBlobs(request);
		return items.map((item) => item.name);
	}

	public uploadText(containerName: string, blobName: string, text: string): Promise<void> {
		const request: UploadTextBlobRequest = { containerName, blobName, text };
		return this.sdkService.uploadText(request).then(() => undefined);
	}

	public deleteBlob(containerName: string, blobName: string): Promise<void> {
		const request = { containerName, blobName };
		return this.sdkService.deleteBlob(request);
	}

	public async createUploadUrl(request: CreateBlobAccessUrlRequest): Promise<string> {
		if (!this.sasSigningService) {
			throw new Error('Client uploads with SAS signing are not configured. Provide a SAS signing service to enable this feature.');
		}
		return await this.sasSigningService.createBlobWriteSasUrl(request);
	}

	public async createReadUrl(request: CreateBlobAccessUrlRequest): Promise<string> {
		if (!this.sasSigningService) {
			throw new Error('SAS read URLs are not configured. Provide a SAS signing service to enable this feature.');
		}
		return await this.sasSigningService.createBlobReadSasUrl(request);
	}
}
