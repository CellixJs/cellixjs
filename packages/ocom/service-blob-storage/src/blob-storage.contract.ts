import type { CreateBlobSasUrlRequest } from '@cellix/service-blob-storage';

export interface CreateBlobAccessUrlRequest extends CreateBlobSasUrlRequest {}

export interface BlobStorage {
	createUploadUrl(request: CreateBlobAccessUrlRequest): Promise<string>;
	createReadUrl(request: CreateBlobAccessUrlRequest): Promise<string>;
}
