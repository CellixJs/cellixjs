import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { Video } from '@ocom/data-sources-mongoose-models/video';
import { Domain } from '@ocom/domain';
import { expect, vi } from 'vitest';
import type { ModelsContext } from '../../../../index.ts';
import { VideoReadRepositoryImpl } from './video.read-repository.ts';

const { find, findById } = vi.hoisted(() => ({ find: vi.fn(), findById: vi.fn() }));

vi.mock('./video.data.ts', () => ({
	VideoDataSourceImpl: vi.fn(function MockVideoDataSource() {
		return { find, findById };
	}),
}));

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/video.read-repository.feature'));

const communityId = '6898b0c34b4a2fbc01e9c697';

function makeDoc(id: string, title: string): Video {
	return { id, community: { id: communityId }, title, status: 'READY', renditionHeights: [] } as unknown as Video;
}

const passport = {
	community: { forCommunity: vi.fn(() => ({ determineIf: vi.fn(() => true) })) },
	video: { forVideo: vi.fn(() => ({ determineIf: vi.fn(() => true) })) },
} as unknown as Domain.Passport;

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let repository: VideoReadRepositoryImpl;
	let single: Domain.Contexts.Video.Video.VideoEntityReference | null;
	let list: Domain.Contexts.Video.Video.VideoEntityReference[];

	BeforeEachScenario(() => {
		find.mockReset();
		findById.mockReset();
	});

	Background(({ Given }) => {
		Given('a VideoReadRepository backed by a mock data source', () => {
			repository = new VideoReadRepositoryImpl({ Video: {} } as unknown as ModelsContext, passport);
		});
	});

	Scenario('Getting a video by id', ({ Given, When, Then }) => {
		Given('a video document exists with id "video-1"', () => {
			findById.mockResolvedValue(makeDoc('video-1', 'Board meeting'));
		});
		When('I call getById with "video-1"', async () => {
			single = await repository.getById('video-1');
		});
		Then('I should receive a Video with title "Board meeting"', () => {
			expect(single).toBeInstanceOf(Domain.Contexts.Video.Video.Video);
			expect(single?.title).toBe('Board meeting');
		});
	});

	Scenario('Getting a video that does not exist', ({ Given, When, Then }) => {
		Given('no video document exists with id "missing"', () => {
			findById.mockResolvedValue(null);
		});
		When('I call getById with "missing"', async () => {
			single = await repository.getById('missing');
		});
		Then('I should receive null', () => {
			expect(single).toBeNull();
		});
	});

	Scenario("Listing a community's videos newest first", ({ Given, When, Then, And }) => {
		Given(`two video documents exist for community "${communityId}"`, () => {
			find.mockResolvedValue([makeDoc('video-2', 'Newer'), makeDoc('video-1', 'Older')]);
		});
		When(`I call getByCommunityId with "${communityId}"`, async () => {
			list = await repository.getByCommunityId(communityId);
		});
		Then('I should receive both videos', () => {
			expect(list.map((video) => video.title)).toEqual(['Newer', 'Older']);
		});
		And('the data source should have been queried by community, sorted by createdAt descending', () => {
			const [filter, options] = find.mock.calls[0] as [{ community: { toString(): string } }, { sort: unknown }];
			expect(filter.community.toString()).toBe(communityId);
			expect(options.sort).toEqual({ createdAt: -1 });
		});
	});

	Scenario('Overriding the sort order', ({ Given, When, Then }) => {
		Given(`two video documents exist for community "${communityId}"`, () => {
			find.mockResolvedValue([makeDoc('video-2', 'Newer'), makeDoc('video-1', 'Older')]);
		});
		When(`I call getByCommunityId with "${communityId}" sorted by title`, async () => {
			list = await repository.getByCommunityId(communityId, { sort: { title: 1 } });
		});
		Then('the data source should have been queried with the title sort and no createdAt sort', () => {
			expect((find.mock.calls[0] as [unknown, { sort: unknown }])[1].sort).toEqual({ title: 1 });
		});
	});
});
