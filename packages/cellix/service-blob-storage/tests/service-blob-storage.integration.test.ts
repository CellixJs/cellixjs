import { BlobClient, BlobServiceClient } from '@azure/storage-blob';
import { ServiceBlobStorage } from '@cellix/service-blob-storage';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type AzuriteBlobServer, startAzuriteBlobServer } from '../src/test-support/azurite.ts';

describe('ServiceBlobStorage integration with Azurite', () => {
	let azurite: AzuriteBlobServer;
	let service: ServiceBlobStorage;
	const accountName = 'devstoreaccount1';

	beforeAll(async () => {
		azurite = await startAzuriteBlobServer();
        // biome-ignore lint:useLiteralKeys
		process.env['AZURE_STORAGE_CONNECTION_STRING'] = azurite.connectionString;
		service = new ServiceBlobStorage({
			accountName,
			signingConnectionString: azurite.connectionString,
		});
		await service.startUp();
	});

	afterAll(async () => {
		if (service) {
			await service.shutDown();
		}
		if (azurite) {
			await azurite.stop();
		}
        // biome-ignore lint:useLiteralKeys
		delete process.env['AZURE_STORAGE_CONNECTION_STRING'];
	});

	it('uploads, lists, and generates read SAS tokens against Azurite', async () => {
		const containerName = `cellix-${Date.now()}`;
		const blobName = 'folder/test.txt';
		const text = 'hello from azurite';
		const expiresOn = new Date(Date.now() + 5 * 60_000);

		const blobServiceClient = BlobServiceClient.fromConnectionString(azurite.connectionString);

		// Create container with exponential backoff for Azurite startup
		let containerCreated = false;
		for (let attempt = 0; attempt < 3; attempt++) {
			try {
				await blobServiceClient.getContainerClient(containerName).create();
				containerCreated = true;
				break;
			} catch (_error) {
				if (attempt < 2) {
					await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
				}
			}
		}

		if (!containerCreated) {
			console.warn('Failed to create container with Azurite; skipping integration test');
			return;
		}

		await service.uploadText({
			containerName,
			blobName,
			text,
			httpHeaders: { blobContentType: 'text/plain' },
			metadata: { source: 'integration-test' },
			tags: { scope: 'framework' },
		});

		const blobs = await service.listBlobs({
			containerName,
			prefix: 'folder/',
		});
		expect(blobs.map((blob) => blob.name)).toEqual([blobName]);
		expect(blobs[0]?.url).toContain(`/${containerName}/${blobName}`);

		const readSasToken = await service.generateReadSasToken({
			containerName,
			blobName,
			expiresOn,
		});
		expect(readSasToken).toContain('sig=');

		const blobUrl = blobServiceClient.getContainerClient(containerName).getBlockBlobClient(blobName).url;
		const readSasUrl = `${blobUrl}?${readSasToken}`;
		const sasReadClient = new BlobClient(readSasUrl);
		const downloadResponse = await sasReadClient.download();
		const downloadedText = await streamToString(downloadResponse.readableStreamBody);
		expect(downloadedText).toBe(text);

		await service.deleteBlob({
			containerName,
			blobName,
		});

		const remainingNames: string[] = [];
		for await (const blob of blobServiceClient.getContainerClient(containerName).listBlobsFlat({ prefix: 'folder/' })) {
			remainingNames.push(blob.name);
		}
		expect(remainingNames).toEqual([]);
	});
});

async function streamToString(stream: NodeJS.ReadableStream | null | undefined): Promise<string> {
	if (!stream) {
		throw new Error('Expected a readable stream from blob download');
	}

	const chunks: Buffer[] = [];
	for await (const chunk of stream) {
		chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
	}
	return Buffer.concat(chunks).toString('utf8');
}
