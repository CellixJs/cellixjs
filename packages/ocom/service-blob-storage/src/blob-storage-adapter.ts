import type { BlobStorage as CellixBlobStorage } from '@cellix/service-blob-storage';
import type { BlobStorage } from './blob-storage.contract.ts';

/**
 * Adapts two framework blob services into the narrow OwnerCommunity contract.
 *
 * @param sdkService - Framework service for SDK blob operations (uses managed identity)
 * @param sasSigningService - Optional framework service for SAS URL generation (uses connection string)
 * @returns Narrow contract with createUploadUrl and createReadUrl methods
 */
export function createBlobStorage(sdkService: CellixBlobStorage, sasSigningService?: CellixBlobStorage): BlobStorage {
	return {
		createUploadUrl: async (request) => {
			if (!sasSigningService) {
				throw new Error('Client uploads with SAS signing are not configured. Provide connectionString to enable this feature.');
			}
			return await sasSigningService.createBlobWriteSasUrl(request);
		},
		createReadUrl: async (request) => {
			if (!sasSigningService) {
				throw new Error('SAS read URLs are not configured. Provide connectionString to enable this feature.');
			}
			return await sasSigningService.createBlobReadSasUrl(request);
		},
	};
}
