import { ServiceBlobStorage as CellixServiceBlobStorage } from '@cellix/service-blob-storage';
import { describe, expect, it } from 'vitest';
import { ServiceBlobStorage } from './index.js';

describe('@ocom/service-blob-storage', () => {
	it('exports an application-facing ServiceBlobStorage that extends the Cellix base service', async () => {
		const service = new ServiceBlobStorage({
			connectionString: 'UseDevelopmentStorage=true;AccountName=devstoreaccount1;AccountKey=abc123=',
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
			url: 'http://127.0.0.1:10000/devstoreaccount1/member-assets/members/123/avatar.png',
		});
		await expect(service.shutDown()).resolves.toBeUndefined();
	});
});
