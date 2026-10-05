import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import type { GraphContext } from '../context.ts';
import videoResolvers from './video.resolvers.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/video.resolvers.feature'));

type Resolver = (parent: unknown, args: unknown, context: GraphContext, info: unknown) => Promise<unknown>;
const query = (name: string) => (videoResolvers.Query as Record<string, unknown>)[name] as Resolver;
const mutation = (name: string) => (videoResolvers.Mutation as Record<string, unknown>)[name] as Resolver;

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let videos: Record<string, { id: string; community: { id: string } }>;
	let communityId: string | undefined;
	let service: Record<'queryByCommunity' | 'queryById' | 'getPlayback' | 'requestUpload' | 'completeUpload', ReturnType<typeof vi.fn>>;
	let result: unknown;
	let caught: unknown;

	const context = () =>
		({
			applicationServices: {
				Video: { Video: service },
				verifiedUser: { verifiedJwt: { sub: 'user-1' }, hints: { communityId, memberId: 'member-1' } },
			},
		}) as unknown as GraphContext;
	const run = async (resolver: Resolver, args: unknown) => {
		try {
			result = await resolver(null, args, context(), {});
		} catch (error) {
			caught = error;
		}
	};

	BeforeEachScenario(() => {
		videos = {};
		result = undefined;
		caught = undefined;
		service = {
			queryByCommunity: vi.fn(async ({ communityId: id }: { communityId: string }) => [{ id: 'video-1', community: { id } }]),
			queryById: vi.fn(async ({ id }: { id: string }) => videos[id] ?? null),
			getPlayback: vi.fn(async () => ({ dashManifestUrl: 'dash', hlsManifestUrl: 'hls', sasToken: 'sig', expiresAt: new Date('2026-10-05T12:00:00Z') })),
			requestUpload: vi.fn(async () => ({ video: { id: 'video-1' }, upload: { url: 'https://storage.test/video-uploads/c/v', headers: { Authorization: 'SharedKey x', 'Content-Type': 'video/mp4' } } })),
			completeUpload: vi.fn(async ({ videoId }: { videoId: string }) => ({ id: videoId, status: 'UPLOADED' })),
		};
	});

	Background(({ Given }) => {
		Given('a signed-in member whose request is scoped to community "community-1"', () => {
			communityId = 'community-1';
		});
	});

	const belongsTo = (videoId: string, community: string) => {
		videos[videoId] = { id: videoId, community: { id: community } };
	};

	Scenario("Listing the current community's videos", ({ When, Then }) => {
		When('I query communityVideos', () => run(query('communityVideos'), {}));
		Then('the videos for community "community-1" should be returned', () => {
			expect(service.queryByCommunity).toHaveBeenCalledWith({ communityId: 'community-1' });
			expect(result).toEqual([{ id: 'video-1', community: { id: 'community-1' } }]);
		});
	});

	Scenario('Rejecting requests without a community scope', ({ Given, When, Then }) => {
		Given('a signed-in user whose request has no community scope', () => {
			communityId = undefined;
		});
		When('I query communityVideos', () => run(query('communityVideos'), {}));
		Then('an "Unauthorized" error should be thrown', () => {
			expect((caught as Error).message).toBe('Unauthorized');
		});
	});

	Scenario('Getting a video in the current community', ({ Given, When, Then }) => {
		Given('video "video-1" belongs to community "community-1"', () => belongsTo('video-1', 'community-1'));
		When('I query videoById for "video-1"', () => run(query('videoById'), { id: 'video-1' }));
		Then('video "video-1" should be returned', () => {
			expect(result).toEqual(videos['video-1']);
		});
	});

	Scenario('Hiding a video from another community', ({ Given, When, Then }) => {
		Given('video "video-9" belongs to community "community-2"', () => belongsTo('video-9', 'community-2'));
		When('I query videoById for "video-9"', () => run(query('videoById'), { id: 'video-9' }));
		Then('null should be returned', () => {
			expect(result).toBeNull();
		});
	});

	Scenario('Getting playback for a video in the current community', ({ Given, When, Then }) => {
		Given('video "video-1" belongs to community "community-1"', () => belongsTo('video-1', 'community-1'));
		When('I query videoPlayback for "video-1"', () => run(query('videoPlayback'), { id: 'video-1' }));
		Then('the playback URLs and token should be returned', () => {
			expect(service.getPlayback).toHaveBeenCalledWith({ videoId: 'video-1' });
			expect(result).toMatchObject({ dashManifestUrl: 'dash', hlsManifestUrl: 'hls', sasToken: 'sig' });
		});
	});

	Scenario('Refusing playback for a video from another community', ({ Given, When, Then, And }) => {
		Given('video "video-9" belongs to community "community-2"', () => belongsTo('video-9', 'community-2'));
		When('I query videoPlayback for "video-9"', () => run(query('videoPlayback'), { id: 'video-9' }));
		Then('null should be returned', () => {
			expect(result).toBeNull();
		});
		And('no playback should be requested', () => {
			expect(service.getPlayback).not.toHaveBeenCalled();
		});
	});

	Scenario('Requesting an upload', ({ When, Then, And }) => {
		When('I request an upload titled "Board meeting" for a 1024-byte "video/mp4" file', () => run(mutation('videoRequestUpload'), { input: { title: 'Board meeting', contentType: 'video/mp4', sizeBytes: 1024 } }));
		Then('the upload should be requested for community "community-1"', () => {
			expect(service.requestUpload).toHaveBeenCalledWith({ communityId: 'community-1', title: 'Board meeting', contentType: 'video/mp4', sizeBytes: 1024 });
		});
		And('the result should succeed with the video and the upload headers as name and value pairs', () => {
			expect(result).toEqual({
				status: { success: true },
				video: { id: 'video-1' },
				upload: {
					url: 'https://storage.test/video-uploads/c/v',
					headers: [
						{ name: 'Authorization', value: 'SharedKey x' },
						{ name: 'Content-Type', value: 'video/mp4' },
					],
				},
			});
		});
	});

	Scenario('Reporting a failed upload request', ({ Given, When, Then }) => {
		Given('requesting an upload fails with "You do not have permission to upload videos"', () => {
			service.requestUpload.mockRejectedValue(new Error('You do not have permission to upload videos'));
		});
		When('I request an upload titled "Board meeting" for a 1024-byte "video/mp4" file', () => run(mutation('videoRequestUpload'), { input: { title: 'Board meeting', contentType: 'video/mp4', sizeBytes: 1024 } }));
		Then('the result should fail with "You do not have permission to upload videos"', () => {
			expect(result).toEqual({ status: { success: false, errorMessage: 'You do not have permission to upload videos' } });
		});
	});

	Scenario('Completing an upload in the current community', ({ Given, When, Then }) => {
		Given('video "video-1" belongs to community "community-1"', () => belongsTo('video-1', 'community-1'));
		When('I complete the upload for "video-1"', () => run(mutation('videoCompleteUpload'), { input: { id: 'video-1' } }));
		Then('the result should succeed with the uploaded video', () => {
			expect(result).toEqual({ status: { success: true }, video: { id: 'video-1', status: 'UPLOADED' } });
		});
	});

	Scenario('Refusing to complete an upload from another community', ({ Given, When, Then, And }) => {
		Given('video "video-9" belongs to community "community-2"', () => belongsTo('video-9', 'community-2'));
		When('I complete the upload for "video-9"', () => run(mutation('videoCompleteUpload'), { input: { id: 'video-9' } }));
		Then('the result should fail with "Video not found"', () => {
			expect(result).toEqual({ status: { success: false, errorMessage: 'Video not found' } });
		});
		And('no upload should be completed', () => {
			expect(service.completeUpload).not.toHaveBeenCalled();
		});
	});
});
