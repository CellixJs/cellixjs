import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { VideoViewing } from '@ocom/data-sources-mongoose-models/video-viewing';
import { Domain } from '@ocom/domain';
import { expect, vi } from 'vitest';
import type { ModelsContext } from '../../../../index.ts';
import { VideoViewingReadRepositoryImpl } from './video-viewing.read-repository.ts';

const { find, findOne } = vi.hoisted(() => ({ find: vi.fn(), findOne: vi.fn() }));

vi.mock('./video-viewing.data.ts', () => ({
	VideoViewingDataSourceImpl: vi.fn(function MockVideoViewingDataSource() {
		return { find, findOne };
	}),
}));

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/video-viewing.read-repository.feature'));

const communityId = '6898b0c34b4a2fbc01e9c697';
const videoId = '6898b0c34b4a2fbc01e9c6b2';
const memberIds = ['6898b0c34b4a2fbc01e9c6a1', '6898b0c34b4a2fbc01e9c6a2'] as const;

function makeDoc(memberId: string): VideoViewing {
	return {
		id: `viewing-${memberId}`,
		community: new MongooseSeedwork.ObjectId(communityId),
		video: new MongooseSeedwork.ObjectId(videoId),
		member: new MongooseSeedwork.ObjectId(memberId),
		durationSeconds: 600,
		bucketSeconds: 5,
		bucketCount: 120,
		watchedBuckets: [],
		watchedBucketCount: 0,
	} as unknown as VideoViewing;
}

const passport = { video: { forVideoViewing: vi.fn(() => ({ determineIf: vi.fn(() => true) })) } } as unknown as Domain.Passport;

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let repository: VideoViewingReadRepositoryImpl;
	let single: Domain.Contexts.Video.VideoViewing.VideoViewingEntityReference | null;
	let list: Domain.Contexts.Video.VideoViewing.VideoViewingEntityReference[];

	BeforeEachScenario(() => {
		find.mockReset();
		findOne.mockReset();
	});

	Background(({ Given }) => {
		Given('a VideoViewingReadRepository backed by a mock data source', () => {
			repository = new VideoViewingReadRepositoryImpl({ VideoViewing: {} } as unknown as ModelsContext, passport);
		});
	});

	Scenario("Getting a member's viewing of a video", ({ Given, When, Then, And }) => {
		Given('the member has a viewing of the video', () => {
			findOne.mockResolvedValue(makeDoc(memberIds[0]));
		});
		When('I call getByVideoAndMember', async () => {
			single = await repository.getByVideoAndMember(videoId, memberIds[0]);
		});
		Then('I should receive a VideoViewing for that member', () => {
			expect(single).toBeInstanceOf(Domain.Contexts.Video.VideoViewing.VideoViewing);
			expect(single?.memberId).toBe(memberIds[0]);
		});
		And('the data source should have been queried by video and member', () => {
			const filter = findOne.mock.calls[0]?.[0] as { video: unknown; member: unknown };
			expect([String(filter.video), String(filter.member)]).toEqual([videoId, memberIds[0]]);
		});
	});

	Scenario('Getting a viewing that does not exist', ({ Given, When, Then }) => {
		Given('the member has no viewing of the video', () => {
			findOne.mockResolvedValue(null);
		});
		When('I call getByVideoAndMember', async () => {
			single = await repository.getByVideoAndMember(videoId, memberIds[0]);
		});
		Then('I should receive null', () => {
			expect(single).toBeNull();
		});
	});

	Scenario("Listing a video's viewings, most recently updated first", ({ Given, When, Then, And }) => {
		Given('two members have viewings of the video', () => {
			find.mockResolvedValue(memberIds.map(makeDoc));
		});
		When('I call getByVideoId', async () => {
			list = await repository.getByVideoId(videoId);
		});
		Then('I should receive both viewings', () => {
			expect(list.map((viewing) => viewing.memberId)).toEqual([...memberIds]);
		});
		And('the data source should have been queried by video, sorted by updatedAt descending', () => {
			const [filter, options] = find.mock.calls[0] as [{ video: unknown }, { sort: unknown }];
			expect(String(filter.video)).toBe(videoId);
			expect(options.sort).toEqual({ updatedAt: -1 });
		});
	});
});
