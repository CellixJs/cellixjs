import { createHash } from 'node:crypto';
import { ServiceBlobStorage as CellixServiceBlobStorage, ServiceClientBlobStorage as CellixServiceClientBlobStorage } from '@cellix/service-blob-storage';
import { describe, expect, it } from 'vitest';
import { ServiceBlobStorage, ServiceClientBlobStorage } from './index.js';

const accountName = 'devstoreaccount1';
const accountKey = createHash('sha256').update('cellix-azurite-test-account-key').digest('base64');
const signingConnectionString = `DefaultEndpointsProtocol=https;AccountName=${accountName};AccountKey=${accountKey};EndpointSuffix=core.windows.net`;

describe('@ocom/service-blob-storage', () => {
	it('re-exports the Cellix ServiceBlobStorage for backend blob operations', async () => {
		const service = new ServiceBlobStorage({
			accountName,
		});

		expect(service).toBeInstanceOf(CellixServiceBlobStorage);
		await expect(service.startUp()).resolves.toBe(service);
		await expect(service.shutDown()).resolves.toBeUndefined();
	});

	it('re-exports the Cellix ServiceClientBlobStorage for client signing operations', async () => {
		const service = new ServiceClientBlobStorage({
			accountName,
			signingConnectionString,
		});

		expect(service).toBeInstanceOf(CellixServiceClientBlobStorage);
		await expect(service.startUp()).resolves.toBe(service);
		await expect(
			service.createBlobWriteAuthorizationHeader({
				containerName: 'member-assets',
				blobName: 'members/123/avatar.png',
				contentLength: 512,
				contentType: 'image/png',
			}),
		).resolves.toMatchObject({
			url: expect.stringContaining(`/member-assets/members/123/avatar.png`),
		});
		await expect(service.shutDown()).resolves.toBeUndefined();
	});
});
