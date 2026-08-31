import { ServiceBlobStorage as CellixServiceBlobStorage, ServiceClientBlobStorage as CellixServiceClientBlobStorage } from '@cellix/service-blob-storage';
import { describe, expect, it } from 'vitest';
import { type FeatureFlagOptions, ServiceBlobStorage, ServiceClientBlobStorage } from './index.js';

const accountName = 'devstoreaccount1';
const signingConnectionString = 'DefaultEndpointsProtocol=https;AccountName=devstoreaccount1;AccountKey=test;EndpointSuffix=core.windows.net';
const featureFlagOptions: FeatureFlagOptions = {
	containerName: 'public',
	fallback: {
		FeatureFlags: [
			{
				Name: 'MAINTENANCE_MSG_SYSTEM_UI_STAFF_PORTAL',
				Value:
					'<div><b>ERAS Fellowship Documents Office Staff Portal Unavailable ##timeRangeStr##.</b> <p>Due to scheduled maintenance, the ERAS Fellowship Documents Office Portal is expected to be unavailable beginning at approximately ##startTimestampStr##. The application is expected to be restored by ##endTimestampStr##. All times are calculated using Eastern Time in the United States. Thank you for your patience and cooperation as we work to maintain high-quality online services.</p></div>',
			},
			{
				Name: 'MAINTENANCE_MSG_IMPENDING_UI_STAFF_PORTAL',
				Value:
					'ERAS Fellowship Documents Office Staff Portal Unavailable ##timeRangeStr##. Due to scheduled maintenance, the ERAS Fellowship Documents Office Admin Portal is expected to be unavailable beginning at approximately ##startTimestampStr##. The application is expected to be restored by ##endTimestampStr##. All times are calculated using Eastern Time in the United States. Thank you for your patience and cooperation as we work to maintain high-quality online services.',
			},
			{ Name: 'MAINTENANCE_IMPENDING_TIMESTAMP_UI_STAFF_PORTAL', Value: '2026-01-01T00:00:00.000Z' },
			{ Name: 'MAINTENANCE_START_TIMESTAMP_UI_STAFF_PORTAL', Value: '2026-01-08T13:00:00.000Z' },
			{ Name: 'MAINTENANCE_END_TIMESTAMP_UI_STAFF_PORTAL', Value: '2026-01-09T17:00:00.000Z' },
			{ Name: 'MAINTENANCE_UPCOMING_UI_STAFF_PORTAL', Value: 'false' },
		],
	},
	blobName: 'feature-flags.json',
};

describe('@ocom/service-blob-storage', () => {
	it('re-exports the Cellix ServiceBlobStorage for backend blob operations', async () => {
		const service = new ServiceBlobStorage({
			accountName,
		});

		expect(service).toBeInstanceOf(CellixServiceBlobStorage);
		await expect(service.startUp()).resolves.toBe(service);
		await expect(service.shutDown()).resolves.toBeUndefined();
	});

	it('enables feature flags on the backend blob-storage service', () => {
		const service = new ServiceBlobStorage({ accountName, featureFlagOptions });

		expect(service.getFeatureFlags).toBeTypeOf('function');
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
