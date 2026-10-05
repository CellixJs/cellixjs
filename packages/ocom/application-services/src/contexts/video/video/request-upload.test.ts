import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import type { BlobStorageOperations, ClientUploadOperations } from '@ocom/service-blob-storage';
import { expect, vi } from 'vitest';
import { requestUpload, type VideoRequestUploadResult } from './request-upload.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/request-upload.feature'));

const communityId = 'c0ffee000000000000000001';
const command = { communityId, title: 'Board meeting', contentType: 'video/mp4', sizeBytes: 1024 };

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
	let getCommunity: ReturnType<typeof vi.fn>;
	let getNewInstance: ReturnType<typeof vi.fn>;
	let save: ReturnType<typeof vi.fn>;
	let blobStorage: BlobStorageOperations;
	let clientOperations: ClientUploadOperations;
	let result: VideoRequestUploadResult | undefined;
	let caught: unknown;

	const run = async () => {
		const dataSources = {
			readonlyDataSource: { Community: { Community: { CommunityReadRepo: { getById: getCommunity } } } },
			domainDataSource: {
				Video: { Video: { VideoUnitOfWork: { withScopedTransaction: vi.fn(async (fn: (repo: unknown) => Promise<void>) => fn({ getNewInstance, save })) } } },
			},
		} as unknown as DataSources;
		try {
			result = await requestUpload(dataSources, blobStorage, clientOperations)(command);
		} catch (error) {
			caught = error;
		}
	};

	BeforeEachScenario(() => {
		result = undefined;
		caught = undefined;
		getCommunity = vi.fn();
		getNewInstance = vi.fn(async (title: string, source: unknown) => ({ id: 'video-1', title, source }));
		save = vi.fn(async (video: unknown) => video);
		blobStorage = { createContainerIfNotExists: vi.fn(async () => undefined) } as unknown as BlobStorageOperations;
		clientOperations = {
			createBlobWriteAuthorizationHeader: vi.fn(async (request: { containerName: string; blobName: string }) => ({
				url: `https://storage.test/${request.containerName}/${request.blobName}`,
				authorizationHeader: 'SharedKey account:signature',
				headers: { 'Content-Type': 'video/mp4', 'Content-Length': '1024', 'x-ms-blob-type': 'BlockBlob', 'x-ms-version': '2021-04-10', 'x-ms-date': 'date' },
			})),
		} as unknown as ClientUploadOperations;
	});

	Scenario('Requesting an upload for a community', ({ Given, When, Then, And }) => {
		Given(`a community exists with id "${communityId}"`, () => {
			getCommunity.mockResolvedValue({ id: communityId } as Domain.Contexts.Community.Community.CommunityEntityReference);
		});
		When('I request an upload titled "Board meeting" for a 1024-byte "video/mp4" file', run);
		Then('a video should be created awaiting upload with its original in "video-uploads" under the community id', () => {
			const [title, source, community] = getNewInstance.mock.calls[0] as [string, { containerName: string; blobName: string; contentType: string; sizeBytes: number }, { id: string }];
			expect(title).toBe('Board meeting');
			expect(source).toMatchObject({ containerName: 'video-uploads', contentType: 'video/mp4', sizeBytes: 1024 });
			expect(source.blobName).toMatch(new RegExp(`^${communityId}/[0-9a-f-]{36}$`));
			expect(community.id).toBe(communityId);
			expect(save).toHaveBeenCalled();
			expect(result?.video.id).toBe('video-1');
		});
		And('the uploads container should be created if missing', () => {
			expect(blobStorage.createContainerIfNotExists).toHaveBeenCalledWith({ containerName: 'video-uploads' });
		});
		And('I should receive a signed PUT for that blob locked to the size and content type', () => {
			const [source] = (getNewInstance.mock.calls[0] as [string, { blobName: string }]).slice(1) as [{ blobName: string }];
			expect(clientOperations.createBlobWriteAuthorizationHeader).toHaveBeenCalledWith({ containerName: 'video-uploads', blobName: source.blobName, contentLength: 1024, contentType: 'video/mp4' });
			expect(result?.upload.url).toBe(`https://storage.test/video-uploads/${source.blobName}`);
		});
		And('the upload headers should include the Authorization header but not Content-Length', () => {
			expect(result?.upload.headers).toEqual({ 'Content-Type': 'video/mp4', 'x-ms-blob-type': 'BlockBlob', 'x-ms-version': '2021-04-10', 'x-ms-date': 'date', Authorization: 'SharedKey account:signature' });
		});
	});

	Scenario('Requesting an upload for a community that does not exist', ({ Given, When, Then, And }) => {
		Given(`no community exists with id "${communityId}"`, () => {
			getCommunity.mockResolvedValue(null);
		});
		When('I try to request an upload', run);
		Then('it should fail with "Community not found"', () => {
			expect((caught as Error).message).toBe('Community not found');
		});
		And('nothing should be signed', () => {
			expect(clientOperations.createBlobWriteAuthorizationHeader).not.toHaveBeenCalled();
		});
	});

	Scenario('Requesting an upload without permission to manage videos', ({ Given, And, When, Then }) => {
		Given(`a community exists with id "${communityId}"`, () => {
			getCommunity.mockResolvedValue({ id: communityId });
		});
		And('the domain rejects creating the video', () => {
			getNewInstance.mockRejectedValue(new Error('You do not have permission to upload videos'));
		});
		When('I try to request an upload', run);
		Then('it should fail with "You do not have permission to upload videos"', () => {
			expect((caught as Error).message).toBe('You do not have permission to upload videos');
		});
		And('nothing should be signed', () => {
			expect(clientOperations.createBlobWriteAuthorizationHeader).not.toHaveBeenCalled();
		});
	});
});
