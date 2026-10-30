// Uploads the placeholder DASH video to local Azurite and enables browser CORS
// so the VideoPlayer can stream it. Run Azurite first (`pnpm run azurite` in apps/api).
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BlobServiceClient } from '@azure/storage-blob';
import { createPlaceholderSasToken, getAzuriteBlobEndpoint, getAzuriteCredential, getPlaceholderManifestUrl, PLACEHOLDER_CONTAINER, PLACEHOLDER_PREFIX } from './azurite-placeholder.ts';

const ASSET_DIRECTORY = fileURLToPath(new URL('../assets/placeholder/', import.meta.url));
const CONTENT_TYPES: Record<string, string> = {
	'.mpd': 'application/dash+xml',
	'.webm': 'video/webm',
	'.jpg': 'image/jpeg',
	'.vtt': 'text/vtt',
};
const STARTUP_TIMEOUT_MS = 30_000;

async function listFiles(directory: string): Promise<string[]> {
	const entries = await readdir(directory, { recursive: true, withFileTypes: true });
	return entries.filter((entry) => entry.isFile() && !entry.name.endsWith('.md')).map((entry) => path.join(entry.parentPath, entry.name));
}

async function waitForAzurite(client: BlobServiceClient): Promise<void> {
	const deadline = Date.now() + STARTUP_TIMEOUT_MS;
	for (;;) {
		try {
			await client.getProperties();
			return;
		} catch (error) {
			if (Date.now() > deadline) throw new Error(`Azurite blob service not reachable at ${client.url}`, { cause: error });
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	}
}

const client = new BlobServiceClient(getAzuriteBlobEndpoint(), getAzuriteCredential());
await waitForAzurite(client);

// Local emulator only: any origin may read, nothing else. Existing rules are kept.
const readRule = {
	allowedOrigins: '*',
	allowedMethods: 'GET,HEAD,OPTIONS',
	allowedHeaders: '*',
	exposedHeaders: 'content-length,content-range,content-type,accept-ranges,etag',
	maxAgeInSeconds: 3600,
};
const { cors = [] } = await client.getProperties();
if (!cors.some((rule) => rule.allowedOrigins === readRule.allowedOrigins && rule.allowedMethods === readRule.allowedMethods)) {
	await client.setProperties({ cors: [...cors, readRule] });
}

const container = client.getContainerClient(PLACEHOLDER_CONTAINER);
await container.createIfNotExists();

const files = await listFiles(ASSET_DIRECTORY);
for (const file of files) {
	const blobName = PLACEHOLDER_PREFIX + path.relative(ASSET_DIRECTORY, file).split(path.sep).join('/');
	await container.getBlockBlobClient(blobName).uploadData(await readFile(file), {
		blobHTTPHeaders: { blobContentType: CONTENT_TYPES[path.extname(file)] ?? 'application/octet-stream' },
	});
}

console.log(`[seed-azurite] uploaded ${files.length} files to ${PLACEHOLDER_CONTAINER}/${PLACEHOLDER_PREFIX}`);
console.log(`[seed-azurite] manifest: ${getPlaceholderManifestUrl()}`);
console.log(`[seed-azurite] read SAS (24h): ${createPlaceholderSasToken()}`);
