import { BlobServiceClient } from '@azure/storage-blob';
import { AzuriteDevRunner, resolveAzureFunctionsLocalSettingsValues } from '@cellix/local-dev';
import { buildOcomApiLocalSettings } from '@ocom/local-dev-config';

new AzuriteDevRunner().start();

/**
 * Browsers upload video originals and stream encoded video straight from blob
 * storage, so local Azurite needs CORS like the deployed storage account (the
 * `cors` parameter in iac/). Any origin is allowed here because local hostnames
 * change per worktree.
 */
async function allowBrowserBlobAccess(connectionString: string): Promise<void> {
	const service = BlobServiceClient.fromConnectionString(connectionString);
	const cors = [{ allowedOrigins: '*', allowedMethods: 'GET,HEAD,PUT,OPTIONS', allowedHeaders: '*', exposedHeaders: '*', maxAgeInSeconds: 3600 }];
	for (let attempt = 0; attempt < 30; attempt++) {
		try {
			await service.setProperties({ cors });
			console.log('[azurite] blob CORS enabled for local browser uploads and playback');
			return;
		} catch {
			// Azurite is still starting.
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	}
	console.error('[azurite] could not enable blob CORS; browser video uploads and playback will fail');
}

const connectionString = resolveAzureFunctionsLocalSettingsValues(buildOcomApiLocalSettings())['AZURE_STORAGE_CONNECTION_STRING'];
if (connectionString) {
	await allowBrowserBlobAccess(connectionString);
}
