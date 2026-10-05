import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { EventBus } from '@cellix/domain-seedwork/event-bus';
import type { Video, VideoModelType } from '@ocom/data-sources-mongoose-models/video';
import { Domain } from '@ocom/domain';
import type { ClientSession } from 'mongoose';
import { expect, vi } from 'vitest';
import { VideoConverter } from './video.domain-adapter.ts';
import { VideoRepository } from './video.repository.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/video.repository.feature'));

const communityId = '6898b0c34b4a2fbc01e9c697';

function makeDoc(overrides: Partial<Video> = {}): Video {
	return {
		id: 'video-1',
		community: { id: communityId, name: 'Test Community' },
		title: 'Board meeting',
		status: 'AWAITING_UPLOAD',
		sourceContainerName: 'video-uploads',
		sourceBlobName: `${communityId}/video-1`,
		sourceContentType: 'video/mp4',
		sourceSizeBytes: 1024,
		renditionHeights: [],
		set(key: keyof Video, value: unknown) {
			(this as Video)[key] = value as never;
		},
		...overrides,
	} as Video;
}

function makePassport(): Domain.Passport {
	return {
		community: { forCommunity: vi.fn(() => ({ determineIf: vi.fn(() => true) })) },
		video: { forVideo: vi.fn(() => ({ determineIf: (fn: (p: Domain.Contexts.Video.VideoDomainPermissions) => boolean) => fn({ canManageVideos: true, canViewVideos: true, isSystemAccount: false }) })) },
	} as unknown as Domain.Passport;
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let repository: VideoRepository;
	let model: VideoModelType;
	let populate: ReturnType<typeof vi.fn>;
	let findById: ReturnType<typeof vi.fn>;
	let found: Video | null;
	let result: Domain.Contexts.Video.Video.Video<never> | undefined;
	let caught: unknown;

	BeforeEachScenario(() => {
		found = null;
		result = undefined;
		caught = undefined;
	});

	Background(({ Given }) => {
		Given('a VideoRepository with a mock model and a passport that can manage videos', () => {
			populate = vi.fn(() => ({ exec: vi.fn(async () => found) }));
			findById = vi.fn(() => ({ populate }));
			const ModelConstructor = vi.fn(function (this: Video) {
				Object.assign(this, makeDoc({ community: undefined as never, title: '', status: '' }));
			});
			model = Object.assign(ModelConstructor, { findById }) as unknown as VideoModelType;
			repository = new VideoRepository(makePassport(), model, new VideoConverter(), {} as EventBus, {} as ClientSession);
		});
	});

	Scenario('Getting a video by id with its community populated', ({ Given, When, Then, And }) => {
		Given('a video document exists with id "video-1"', () => {
			found = makeDoc();
		});
		When('I call getById with "video-1"', async () => {
			result = (await repository.getById('video-1')) as never;
		});
		Then('it should return a Video domain object', () => {
			expect(result).toBeInstanceOf(Domain.Contexts.Video.Video.Video);
			expect(result?.title).toBe('Board meeting');
		});
		And('the model should have been queried by id with the community populated', () => {
			expect(findById).toHaveBeenCalledWith('video-1');
			expect(populate).toHaveBeenCalledWith('community');
		});
	});

	Scenario('Getting a video that does not exist', ({ Given, When, Then }) => {
		Given('no video document exists with id "missing"', () => {
			found = null;
		});
		When('I call getById with "missing"', async () => {
			try {
				await repository.getById('missing');
			} catch (error) {
				caught = error;
			}
		});
		Then('an error should be thrown indicating "Video with id missing not found"', () => {
			expect((caught as Error).message).toBe('Video with id missing not found');
		});
	});

	Scenario('Creating a new video', ({ When, Then }) => {
		When('I call getNewInstance with title "Board meeting", a valid source, and a community reference', async () => {
			result = (await repository.getNewInstance('Board meeting', { containerName: 'video-uploads', blobName: `${communityId}/video-1`, contentType: 'video/mp4', sizeBytes: 1024 }, {
				id: communityId,
			} as Domain.Contexts.Community.Community.CommunityEntityReference)) as never;
		});
		Then('it should return a Video awaiting upload for that community', () => {
			expect(result?.status).toBe('AWAITING_UPLOAD');
			expect(result?.title).toBe('Board meeting');
			expect(result?.community.id).toBe(communityId);
			expect(result?.sourceSizeBytes).toBe(1024);
		});
	});
});
