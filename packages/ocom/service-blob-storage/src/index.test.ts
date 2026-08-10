import { createHash } from 'node:crypto';
import { ServiceBlobStorage as CellixServiceBlobStorage, ServiceClientBlobStorage as CellixServiceClientBlobStorage } from '@cellix/service-blob-storage';
import { describe, expect, it, vi } from 'vitest';
import { ServiceBlobStorage, ServiceClientBlobStorage } from './index.js';

const accountName = 'devstoreaccount1';
const accountKey = createHash('sha256').update('cellix-azurite-test-account-key').digest('base64');
const signingConnectionString = `DefaultEndpointsProtocol=https;AccountName=${accountName};AccountKey=${accountKey};EndpointSuffix=core.windows.net`;

class TestServiceBlobStorage extends ServiceBlobStorage {
	public useBlobServiceClient(blobServiceClient: never): void {
		this.setBlobServiceClient(blobServiceClient);
	}
}

function createBlobServiceClient(featureFlags: string | Error): never {
	const downloadToBuffer = featureFlags instanceof Error ? vi.fn().mockRejectedValue(featureFlags) : vi.fn().mockResolvedValue(Buffer.from(featureFlags));
	const getBlockBlobClient = vi.fn().mockReturnValue({ downloadToBuffer });
	const getContainerClient = vi.fn().mockReturnValue({ getBlockBlobClient });

	return { getContainerClient } as never;
}

describe('@ocom/service-blob-storage', () => {
	it('returns feature flags from the public feature-flags blob', async () => {
		const service = new TestServiceBlobStorage({ accountName });
		service.useBlobServiceClient(createBlobServiceClient('{"FeatureFlags":[{"Name":"NEW_MEMBER_FLOW","Description":"Enables the new member flow","Value":"true","AllowedValues":["true","false"],"RetirementDate":"2026-12-31"}]}'));

		await expect(service.getFeatureFlags()).resolves.toEqual({
			FeatureFlags: [
				{
					Name: 'NEW_MEMBER_FLOW',
					Description: 'Enables the new member flow',
					Value: 'true',
					AllowedValues: ['true', 'false'],
					RetirementDate: '2026-12-31',
				},
			],
		});
	});

	it('returns local feature flags when the public feature-flags blob does not exist', async () => {
		const service = new TestServiceBlobStorage({ accountName });
		service.useBlobServiceClient(createBlobServiceClient(Object.assign(new Error('The specified blob does not exist.'), { code: 'BlobNotFound', statusCode: 404 })));

		await expect(service.getFeatureFlags()).resolves.toEqual({ FeatureFlags: [] });
	});

	it('rejects a feature-flags blob with an invalid payload', async () => {
		const service = new TestServiceBlobStorage({ accountName });
		service.useBlobServiceClient(createBlobServiceClient('{"featureFlags":[]}'));

		await expect(service.getFeatureFlags()).rejects.toThrow('Feature flag payload validation failed');
	});

	it('rejects malformed feature-flag JSON', async () => {
		const service = new TestServiceBlobStorage({ accountName });
		service.useBlobServiceClient(createBlobServiceClient('{'));

		await expect(service.getFeatureFlags()).rejects.toThrow(SyntaxError);
	});

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
