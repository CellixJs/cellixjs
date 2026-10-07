import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { EventBus } from '@cellix/domain-seedwork/event-bus';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { VideoViewing, VideoViewingModelType } from '@ocom/data-sources-mongoose-models/video-viewing';
import { Domain } from '@ocom/domain';
import type { ClientSession } from 'mongoose';
import { expect, vi } from 'vitest';
import { VideoViewingConverter } from './video-viewing.domain-adapter.ts';
import { VideoViewingRepository } from './video-viewing.repository.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/video-viewing.repository.feature'));

const communityId = '6898b0c34b4a2fbc01e9c697';
const memberId = '6898b0c34b4a2fbc01e9c6a1';
const videoId = '6898b0c34b4a2fbc01e9c6b2';

function makeDoc(overrides: Partial<VideoViewing> = {}): VideoViewing {
	return {
		id: 'viewing-1',
		community: new MongooseSeedwork.ObjectId(communityId),
		video: new MongooseSeedwork.ObjectId(videoId),
		member: new MongooseSeedwork.ObjectId(memberId),
		durationSeconds: 600,
		bucketSeconds: 5,
		bucketCount: 120,
		watchedBuckets: [{ start: 0, end: 11 }],
		watchedBucketCount: 12,
		creditSeconds: 60,
		lastReportAt: new Date('2026-10-07T12:01:00Z'),
		completedAt: null,
		set(key: keyof VideoViewing, value: unknown) {
			(this as VideoViewing)[key] = value as never;
		},
		...overrides,
	} as VideoViewing;
}

function makePassport(): Domain.Passport {
	return {
		video: {
			forVideoViewing: vi.fn((root: Domain.Contexts.Video.VideoViewing.VideoViewingEntityReference) => ({
				determineIf: (fn: (p: Domain.Contexts.Video.VideoDomainPermissions) => boolean) =>
					fn({ canManageVideos: false, canEncodeVideos: false, canViewVideos: true, isOwnVideoViewing: root.memberId === memberId, isSystemAccount: false }),
			})),
		},
	} as unknown as Domain.Passport;
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let repository: VideoViewingRepository;
	let findOne: ReturnType<typeof vi.fn>;
	let found: VideoViewing | null;
	let result: Domain.Contexts.Video.VideoViewing.VideoViewing<never> | undefined;

	BeforeEachScenario(() => {
		found = null;
		result = undefined;
	});

	Background(({ Given }) => {
		Given(`a VideoViewingRepository with a mock model and a passport for member "${memberId}"`, () => {
			findOne = vi.fn(() => ({ exec: vi.fn(async () => found) }));
			const ModelConstructor = vi.fn(function (this: VideoViewing) {
				Object.assign(this, makeDoc({ community: undefined as never, video: undefined as never, member: undefined as never, watchedBuckets: [], watchedBucketCount: 0 }));
			});
			const model = Object.assign(ModelConstructor, { findOne }) as unknown as VideoViewingModelType;
			repository = new VideoViewingRepository(makePassport(), model, new VideoViewingConverter(), {} as EventBus, {} as ClientSession);
		});
	});

	Scenario("Getting a member's viewing of a video", ({ Given, When, Then, And }) => {
		Given(`the member has a viewing of video "${videoId}"`, () => {
			found = makeDoc();
		});
		When('I call getByVideoAndMember for that video and member', async () => {
			result = (await repository.getByVideoAndMember(videoId, memberId)) as never;
		});
		Then('it should return a VideoViewing domain object with the stored buckets', () => {
			expect(result).toBeInstanceOf(Domain.Contexts.Video.VideoViewing.VideoViewing);
			expect(result?.watchedBuckets).toEqual([{ start: 0, end: 11 }]);
			expect([result?.communityId, result?.videoId, result?.memberId]).toEqual([communityId, videoId, memberId]);
		});
		And('the model should have been queried by video and member', () => {
			const filter = findOne.mock.calls[0]?.[0] as { video: unknown; member: unknown };
			expect(String(filter.video)).toBe(videoId);
			expect(String(filter.member)).toBe(memberId);
		});
	});

	Scenario('Getting a viewing that does not exist', ({ Given, When, Then }) => {
		Given(`the member has no viewing of video "${videoId}"`, () => {
			found = null;
		});
		When('I call getByVideoAndMember for that video and member', async () => {
			result = (await repository.getByVideoAndMember(videoId, memberId)) as never;
		});
		Then('it should return undefined', () => {
			expect(result).toBeUndefined();
		});
	});

	Scenario('Starting a new viewing', ({ When, Then }) => {
		When('I call getNewInstance for a ready 10-minute video and the member', async () => {
			const video = { id: videoId, status: 'READY', durationSeconds: 600, community: { id: communityId } } as unknown as Domain.Contexts.Video.Video.VideoEntityReference;
			result = (await repository.getNewInstance(video, memberId, new Date('2026-10-07T12:00:00Z'))) as never;
		});
		Then('it should return a VideoViewing with 120 buckets for that video and member', () => {
			expect(result?.bucketCount).toBe(120);
			expect(result?.watchedBucketCount).toBe(0);
			expect([result?.communityId, result?.videoId, result?.memberId]).toEqual([communityId, videoId, memberId]);
		});
	});
});
