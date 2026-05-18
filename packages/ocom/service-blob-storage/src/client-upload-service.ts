import type { ServiceBase } from '@cellix/api-services-spec';
import { type BlobUploadAuthorizationHeader, ClientUploadSigner as FrameworkClientUploadSigner } from '@cellix/service-blob-storage';
import type { ClientUploadService, CreateBlobAccessUrlRequest } from './blob-storage.contract.js';

/**
 * OCOM application adapter that implements ClientUploadService.
 * Wraps the framework's ClientUploadSigner and provides lifecycle management.
 * Uses canonical SharedKey authorization headers for client-side uploads.
 */
export class ServiceBlobStorageClientUpload implements ClientUploadService, ServiceBase {
	private readonly signer: FrameworkClientUploadSigner;

	constructor(connectionString: string) {
		this.signer = new FrameworkClientUploadSigner(connectionString);
	}

	createUploadUrl(request: CreateBlobAccessUrlRequest): Promise<BlobUploadAuthorizationHeader> {
		return this.signer.createBlobWriteAuthorizationHeader(request);
	}

	createReadUrl(request: CreateBlobAccessUrlRequest): Promise<BlobUploadAuthorizationHeader> {
		return this.signer.createBlobReadAuthorizationHeader(request);
	}

	async startUp(): Promise<void> {
		// No initialization needed for auth header signing
	}

	async shutDown(): Promise<void> {
		// No cleanup needed for auth header signing
	}
}
