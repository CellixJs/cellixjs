import { BlobClient, BlobServiceClient, BlockBlobClient, ContainerClient } from '@azure/storage-blob';
import { ServiceBlobStorage } from '@cellix/service-blob-storage';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type AzuriteBlobServer, startAzuriteBlobServer } from './test-support/azurite.ts';

describe('ServiceBlobStorage integration with Azurite', () => {
	let azurite: AzuriteBlobServer;
	let service: ServiceBlobStorage;

	beforeAll(async () => {
		azurite = await startAzuriteBlobServer();
		service = new ServiceBlobStorage({ connectionString: azurite.connectionString });
		await service.startUp();
	});

	afterAll(async () => {
		if (service) {
			await service.shutDown();
		}
		if (azurite) {
			await azurite.stop();
		}
	});

	it('uploads, lists, creates SAS URLs, and deletes blobs against Azurite', async () => {
		const containerName = `cellix-${Date.now()}`;
		const blobName = 'folder/test.txt';
		const text = 'hello from azurite';
		const expiresOn = new Date(Date.now() + 5 * 60_000);

		const blobServiceClient = BlobServiceClient.fromConnectionString(azurite.connectionString);
		await blobServiceClient.getContainerClient(containerName).create();

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

		const readSasUrl = await service.createBlobReadSasUrl({
			containerName,
			blobName,
			expiresOn,
		});
		const writeSasUrl = await service.createBlobWriteSasUrl({
			containerName,
			blobName: 'folder/upload-via-sas.txt',
			expiresOn,
		});
		const containerSasUrl = await service.createContainerListSasUrl({
			containerName,
			expiresOn,
		});

		expect(readSasUrl).toContain(`/${containerName}/${blobName}?`);
		expect(writeSasUrl).toContain(`/${containerName}/folder/upload-via-sas.txt?`);
		expect(containerSasUrl).toContain(`/${containerName}?`);

		const sasReadClient = new BlobClient(readSasUrl);
		const downloadResponse = await sasReadClient.download();
		const downloadedText = await streamToString(downloadResponse.readableStreamBody);
		expect(downloadedText).toBe(text);

		const sasWriteClient = new BlockBlobClient(writeSasUrl);
		await sasWriteClient.upload('created through sas', Buffer.byteLength('created through sas'));

		const sasContainerClient = new ContainerClient(containerSasUrl);
		const names: string[] = [];
		for await (const blob of sasContainerClient.listBlobsFlat({ prefix: 'folder/' })) {
			names.push(blob.name);
		}
		expect(names.sort()).toEqual([blobName, 'folder/upload-via-sas.txt']);

		await service.deleteBlob({
			containerName,
			blobName,
		});

		const remainingNames: string[] = [];
		for await (const blob of blobServiceClient.getContainerClient(containerName).listBlobsFlat({ prefix: 'folder/' })) {
			remainingNames.push(blob.name);
		}
		expect(remainingNames).toEqual(['folder/upload-via-sas.txt']);
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
