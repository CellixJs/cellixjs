import type { BlobStorage as CellixBlobStorage } from '@cellix/service-blob-storage';
import { ServiceBlobStorage } from '@cellix/service-blob-storage';
import type { BlobStorage } from './blob-storage.contract.ts';
import { ServiceBlobStorage as OcomServiceBlobStorage } from './service-blob-storage.ts';

/**
 * Narrows the framework blob service to the small OwnerCommunity contract exposed through ApiContext.
 */
export function createBlobStorage(blobStorage: CellixBlobStorage): BlobStorage {
	return {
		createUploadUrl: (request) => blobStorage.createBlobWriteSasUrl(request),
		createReadUrl: (request) => blobStorage.createBlobReadSasUrl(request),
	};
}

/**
 * Factory to create a BlobStorage service with environment-aware credential selection.
 *
 * In production (no connection string in ServiceBlobStorage), uses managed identity (DefaultAzureCredential).
 * In local/Azurite, uses the connection string to connect to the local emulator.
 *
 * Both app settings are available for consumption by SAS signers or other consumers.
 */
export function createBlobStorageFactory(options: { accountName: string | undefined; connectionString: string | undefined }): {
	blobStorageClient: OcomServiceBlobStorage;
	accountName: string;
	connectionString: string;
} {
	const isLocal = process.env['NODE_ENV'] === 'development' || process.env['USE_AZURITE'] === 'true';

	// In local/Azurite, only pass connection string for all operations
	// In production, only pass account name (managed identity via DefaultAzureCredential)
	// This ensures managed identity is used in production and connection string in local/Azurite
	const frameworkServiceOptions: { accountName?: string; connectionString?: string } = {};
	if (isLocal && options.connectionString) {
		frameworkServiceOptions.connectionString = options.connectionString;
	} else if (!isLocal && options.accountName) {
		frameworkServiceOptions.accountName = options.accountName;
	}

	const frameworkService = new ServiceBlobStorage(frameworkServiceOptions);

	return {
		blobStorageClient: new OcomServiceBlobStorage({ frameworkService }),
		accountName: options.accountName || '',
		connectionString: options.connectionString || '',
	};
}
