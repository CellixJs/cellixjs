import type { ServiceBase } from '@cellix/api-services-spec';
import { ClientUploadSigner as FrameworkClientUploadSigner } from '@cellix/service-blob-storage';
import type { ClientUploadService, CreateBlobAccessUrlRequest } from './blob-storage.contract.ts';

/**
 * OCOM application adapter that implements ClientUploadService.
 * Wraps the framework's ClientUploadSigner and provides lifecycle management.
 */
export class ServiceBlobStorageClientUpload implements ClientUploadService, ServiceBase {
	private readonly signer: FrameworkClientUploadSigner;

	constructor(connectionString: string) {
		this.signer = new FrameworkClientUploadSigner(connectionString);
	}

	createUploadUrl(request: CreateBlobAccessUrlRequest): Promise<string> {
		return this.signer.createBlobWriteSasUrl(request);
	}

	createReadUrl(request: CreateBlobAccessUrlRequest): Promise<string> {
		return this.signer.createBlobReadSasUrl(request);
	}

	async startUp(): Promise<void> {
		// No initialization needed for SAS signing
	}

	async shutDown(): Promise<void> {
		// No cleanup needed for SAS signing
	}
}
