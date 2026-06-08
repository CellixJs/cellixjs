import { createHash } from 'node:crypto';
import { ServiceBlobStorage as CellixServiceBlobStorage } from '@cellix/service-blob-storage';
import { describe, expect, it } from 'vitest';
import { ServiceBlobStorage } from './index.js';

const accountName = 'devstoreaccount1';
const accountKey = createHash('sha256').update('cellix-azurite-test-account-key').digest('base64');
const signingConnectionString = `DefaultEndpointsProtocol=https;AccountName=${accountName};AccountKey=${accountKey};EndpointSuffix=core.windows.net`;

describe('@ocom/service-blob-storage', () => {
	it('re-exports the Cellix ServiceBlobStorage for application use', async () => {
		const service = new ServiceBlobStorage({
			accountName,
			signingConnectionString,
		});

		expect(service).toBeInstanceOf(CellixServiceBlobStorage);
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
