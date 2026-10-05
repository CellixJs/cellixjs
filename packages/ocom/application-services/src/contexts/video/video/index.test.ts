import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { DataSources } from '@ocom/persistence';
import type { BlobStorageOperations, ClientUploadOperations } from '@ocom/service-blob-storage';
import { expect, vi } from 'vitest';
import { Video } from './index.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/index.feature'));

test.for(feature, ({ Scenario }) => {
	const getByCommunityId = vi.fn(async () => [{ id: 'video-2' }, { id: 'video-1' }]);
	const getById = vi.fn(async () => ({ id: 'video-1' }));
	const dataSources = { readonlyDataSource: { Video: { Video: { VideoReadRepo: { getByCommunityId, getById } } } } } as unknown as DataSources;
	const service = Video(dataSources, {} as BlobStorageOperations, {} as ClientUploadOperations);

	Scenario('Building the video application service', ({ When, Then }) => {
		When('I build the Video application service', () => {
			expect(service).toBeDefined();
		});
		Then('it should expose the member and staff video operations', () => {
			expect(Object.keys(service).sort()).toEqual(['completeUpload', 'getPlayback', 'queryAwaitingEncoding', 'queryByCommunity', 'queryById', 'recordEncodingResult', 'requestOutputUploads', 'requestUpload', 'startEncoding']);
		});
	});

	Scenario('Querying videos', ({ Given, When, Then }) => {
		let list: unknown;
		let single: unknown;
		Given('the read repository returns videos', () => {
			getByCommunityId.mockClear();
		});
		When('I query videos by community and by id', async () => {
			list = await service.queryByCommunity({ communityId: 'c1' });
			single = await service.queryById({ id: 'video-1' });
		});
		Then('the read repository should be asked for that community and that id', () => {
			expect(getByCommunityId).toHaveBeenCalledWith('c1');
			expect(getById).toHaveBeenCalledWith('video-1');
			expect(list).toEqual([{ id: 'video-2' }, { id: 'video-1' }]);
			expect(single).toEqual({ id: 'video-1' });
		});
	});
});
