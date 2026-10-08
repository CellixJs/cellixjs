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
const field = (type: 'Video' | 'VideoViewing', name: string) => (videoResolvers[type] as Record<string, unknown>)[name] as Resolver;

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let videos: Record<string, { id: string; community: { id: string } }>;
	let communityId: string | undefined;
	let service: Record<
		'queryByCommunity' | 'queryById' | 'getPlayback' | 'requestUpload' | 'completeUpload' | 'queryAwaitingEncoding' | 'startEncoding' | 'requestOutputUploads' | 'recordEncodingResult' | 'attachCaption' | 'removeCaption',
		ReturnType<typeof vi.fn>
	>;
	let viewingService: Record<'recordProgress' | 'queryMine' | 'queryByVideo', ReturnType<typeof vi.fn>>;
	let memberService: { queryById: ReturnType<typeof vi.fn> };
	let memberId: string | undefined;
	let signedIn: boolean;
	let result: unknown;
	let caught: unknown;

	const context = () =>
		({
			applicationServices: {
				Video: { Video: service, VideoViewing: viewingService },
				Community: { Member: memberService },
				verifiedUser: signedIn ? { verifiedJwt: { sub: 'user-1' }, hints: { communityId, memberId } } : null,
			},
		}) as unknown as GraphContext;
	const run = async (resolver: Resolver, args: unknown, parent: unknown = null) => {
		try {
			result = await resolver(parent, args, context(), {});
		} catch (error) {
			caught = error;
		}
	};

	BeforeEachScenario(() => {
		videos = {};
		signedIn = true;
		memberId = 'member-1';
		viewingService = {
			recordProgress: vi.fn(async ({ videoId }: { videoId: string }) => ({ id: 'viewing-1', videoId })),
			queryMine: vi.fn(async ({ memberId: id }: { memberId: string }) => ({ id: 'viewing-1', memberId: id })),
			queryByVideo: vi.fn(async () => [{ id: 'viewing-1' }, { id: 'viewing-2' }]),
		};
		memberService = { queryById: vi.fn(async ({ id }: { id: string }) => ({ id, memberName: 'Pat' })) };
		result = undefined;
		caught = undefined;
		service = {
			queryByCommunity: vi.fn(async ({ communityId: id }: { communityId: string }) => [{ id: 'video-1', community: { id } }]),
			queryById: vi.fn(async ({ id }: { id: string }) => videos[id] ?? null),
			getPlayback: vi.fn(async () => ({
				dashManifestUrl: 'dash',
				hlsManifestUrl: 'hls',
				captionTracks: [{ language: 'es', label: 'Español', kind: 'subtitles', url: 'https://storage.test/videos-c1/video-1/captions/es.vtt' }],
				sasToken: 'sig',
				expiresAt: new Date('2026-10-05T12:00:00Z'),
			})),
			requestUpload: vi.fn(async () => ({ video: { id: 'video-1' }, upload: { url: 'https://storage.test/video-uploads/c/v', headers: { Authorization: 'SharedKey x', 'Content-Type': 'video/mp4' } } })),
			completeUpload: vi.fn(async ({ videoId }: { videoId: string }) => ({ id: videoId, status: 'UPLOADED' })),
			queryAwaitingEncoding: vi.fn(async () => [{ id: 'video-3' }]),
			startEncoding: vi.fn(async ({ videoId }: { videoId: string }) => ({ video: { id: videoId, status: 'ENCODING' }, sourceUrl: 'https://storage.test/src?sig', outputContainerName: 'videos-c1', outputPrefix: `${videoId}/` })),
			requestOutputUploads: vi.fn(async ({ paths }: { paths: string[] }) => paths.map((p) => ({ path: p, url: `https://storage.test/videos-c1/video-1/${p}?sig` }))),
			recordEncodingResult: vi.fn(async ({ videoId }: { videoId: string }) => ({ id: videoId, status: 'READY' })),
			attachCaption: vi.fn(async ({ videoId }: { videoId: string }) => ({ id: videoId })),
			removeCaption: vi.fn(async ({ videoId }: { videoId: string }) => ({ id: videoId })),
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
			expect(result).toMatchObject({
				dashManifestUrl: 'dash',
				hlsManifestUrl: 'hls',
				sasToken: 'sig',
				captionTracks: [{ language: 'es', label: 'Español', kind: 'SUBTITLES', url: 'https://storage.test/videos-c1/video-1/captions/es.vtt' }],
			});
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

	Scenario("Resolving a video's community fields", ({ Given, When, Then }) => {
		let parent: unknown;
		let fields: unknown[] = [];
		Given('a video whose community "community-1" is named "Maple Grove"', () => {
			parent = { id: 'video-1', community: { id: 'community-1', name: 'Maple Grove' } };
		});
		When("I resolve the video's communityId and communityName", async () => {
			const fieldResolvers = videoResolvers.Video as Record<'communityId' | 'communityName', Resolver>;
			fields = [await fieldResolvers.communityId(parent, {}, context(), {}), await fieldResolvers.communityName(parent, {}, context(), {})];
		});
		Then('they should be "community-1" and "Maple Grove"', () => {
			expect(fields).toEqual(['community-1', 'Maple Grove']);
		});
	});

	Scenario('Resolving whether the caller manages a video', ({ Given, When, Then }) => {
		let parent: unknown;
		let field: unknown;
		Given('a video the caller manages', () => {
			parent = { id: 'video-1', canManage: () => true };
		});
		When("I resolve the video's canManage", async () => {
			field = await (videoResolvers.Video as Record<'canManage', Resolver>).canManage(parent, {}, context(), {});
		});
		Then('it should be true', () => {
			expect(field).toBe(true);
		});
	});

	Scenario('Listing videos awaiting encoding as staff', ({ Given, When, Then }) => {
		Given('a signed-in staff user with no community scope', () => {
			communityId = undefined;
		});
		When('I query videosAwaitingEncoding', () => run(query('videosAwaitingEncoding'), {}));
		Then('the videos the caller can encode should be returned', () => {
			expect(result).toEqual([{ id: 'video-3' }]);
		});
	});

	Scenario('Starting to encode as staff', ({ Given, When, Then }) => {
		Given('a signed-in staff user with no community scope', () => {
			communityId = undefined;
		});
		When('I start encoding "video-1"', () => run(mutation('videoStartEncoding'), { input: { id: 'video-1' } }));
		Then('the result should succeed with the video and the encoding start details', () => {
			expect(result).toEqual({
				status: { success: true },
				video: { id: 'video-1', status: 'ENCODING' },
				encoding: { sourceUrl: 'https://storage.test/src?sig', outputContainerName: 'videos-c1', outputPrefix: 'video-1/' },
			});
		});
	});

	Scenario('Requesting output upload links as staff', ({ Given, When, Then }) => {
		Given('a signed-in staff user with no community scope', () => {
			communityId = undefined;
		});
		When('I request output upload links for "manifest.mpd"', () => run(mutation('videoRequestOutputUploads'), { input: { id: 'video-1', paths: ['manifest.mpd'] } }));
		Then('the result should succeed with one upload link per path', () => {
			expect(service.requestOutputUploads).toHaveBeenCalledWith({ videoId: 'video-1', paths: ['manifest.mpd'] });
			expect(result).toEqual({ status: { success: true }, uploads: [{ path: 'manifest.mpd', url: 'https://storage.test/videos-c1/video-1/manifest.mpd?sig' }] });
		});
	});

	Scenario('Recording a successful encode as staff', ({ Given, When, Then }) => {
		const succeeded = { dashManifestPath: 'manifest.mpd', hlsManifestPath: 'master.m3u8', durationSeconds: 12.5, renditionHeights: [720] };
		Given('a signed-in staff user with no community scope', () => {
			communityId = undefined;
		});
		When('I record a successful encode for "video-1"', () => run(mutation('videoRecordEncodingResult'), { input: { id: 'video-1', succeeded } }));
		Then('the success should be recorded and the result should succeed', () => {
			expect(service.recordEncodingResult).toHaveBeenCalledWith({ videoId: 'video-1', succeeded });
			expect(result).toEqual({ status: { success: true }, video: { id: 'video-1', status: 'READY' } });
		});
	});

	Scenario('Recording an encode result with both success and failure', ({ Given, When, Then, And }) => {
		Given('a signed-in staff user with no community scope', () => {
			communityId = undefined;
		});
		When('I record an encode result for "video-1" with both succeeded and failed', () =>
			run(mutation('videoRecordEncodingResult'), {
				input: { id: 'video-1', succeeded: { dashManifestPath: 'm', hlsManifestPath: 'h', durationSeconds: 1, renditionHeights: [360] }, failed: { code: 'x', message: 'y' } },
			}),
		);
		Then('the result should fail with "Provide exactly one of succeeded or failed"', () => {
			expect(result).toEqual({ status: { success: false, errorMessage: 'Provide exactly one of succeeded or failed' } });
		});
		And('nothing should be recorded', () => {
			expect(service.recordEncodingResult).not.toHaveBeenCalled();
		});
	});

	Scenario('Rejecting staff operations without a signed-in user', ({ Given, When, Then }) => {
		Given('no signed-in user', () => {
			signedIn = false;
		});
		When('I start encoding "video-1"', () => run(mutation('videoStartEncoding'), { input: { id: 'video-1' } }));
		Then('the result should fail with "Unauthorized"', () => {
			expect(result).toEqual({ status: { success: false, errorMessage: 'Unauthorized' } });
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

	Scenario("Resolving a video's caption tracks", ({ Given, When, Then }) => {
		let parent: unknown;
		let tracks: unknown;
		Given('a video with English captions and Spanish subtitles', () => {
			parent = {
				captionTracks: [
					{ language: 'en', label: 'English', kind: 'captions', containerName: 'videos-c1', blobName: 'video-1/captions/en.vtt' },
					{ language: 'es', label: 'Español', kind: 'subtitles', containerName: 'videos-c1', blobName: 'video-1/captions/es.vtt' },
				],
			};
		});
		When("I resolve the video's captionTracks", async () => {
			tracks = await (videoResolvers.Video as Record<'captionTracks', Resolver>).captionTracks(parent, {}, context(), {});
		});
		Then('they should list each language, label, and kind without storage details', () => {
			expect(tracks).toEqual([
				{ language: 'en', label: 'English', kind: 'CAPTIONS' },
				{ language: 'es', label: 'Español', kind: 'SUBTITLES' },
			]);
		});
	});

	Scenario('Attaching captions to a video in the current community', ({ Given, When, Then }) => {
		Given('video "video-1" belongs to community "community-1"', () => belongsTo('video-1', 'community-1'));
		When('I attach SUBTITLES in "es" labelled "Español" to "video-1"', () => run(mutation('videoAttachCaption'), { input: { id: 'video-1', language: 'es', label: 'Español', kind: 'SUBTITLES', content: 'WEBVTT' } }));
		Then('the caption file should be attached as "subtitles"', () => {
			expect(service.attachCaption).toHaveBeenCalledWith({ videoId: 'video-1', language: 'es', label: 'Español', kind: 'subtitles', content: 'WEBVTT' });
			expect(result).toEqual({ status: { success: true }, video: { id: 'video-1' } });
		});
	});

	Scenario('Refusing to attach captions to a video from another community', ({ Given, When, Then, And }) => {
		Given('video "video-9" belongs to community "community-2"', () => belongsTo('video-9', 'community-2'));
		When('I attach CAPTIONS in "en" labelled "English" to "video-9"', () => run(mutation('videoAttachCaption'), { input: { id: 'video-9', language: 'en', label: 'English', kind: 'CAPTIONS', content: 'WEBVTT' } }));
		Then('the result should fail with "Video not found"', () => {
			expect(result).toEqual({ status: { success: false, errorMessage: 'Video not found' } });
		});
		And('no captions should be attached', () => {
			expect(service.attachCaption).not.toHaveBeenCalled();
		});
	});

	Scenario('Removing captions from a video in the current community', ({ Given, When, Then }) => {
		Given('video "video-1" belongs to community "community-1"', () => belongsTo('video-1', 'community-1'));
		When('I remove the "en" captions from "video-1"', () => run(mutation('videoRemoveCaption'), { input: { id: 'video-1', language: 'en' } }));
		Then('the captions should be removed', () => {
			expect(service.removeCaption).toHaveBeenCalledWith({ videoId: 'video-1', language: 'en' });
			expect(result).toEqual({ status: { success: true }, video: { id: 'video-1' } });
		});
	});

	Scenario('Refusing to remove captions from a video in another community', ({ Given, When, Then, And }) => {
		Given('video "video-9" belongs to community "community-2"', () => belongsTo('video-9', 'community-2'));
		When('I remove the "en" captions from "video-9"', () => run(mutation('videoRemoveCaption'), { input: { id: 'video-9', language: 'en' } }));
		Then('the result should fail with "Video not found"', () => {
			expect(result).toEqual({ status: { success: false, errorMessage: 'Video not found' } });
		});
		And('no captions should be removed', () => {
			expect(service.removeCaption).not.toHaveBeenCalled();
		});
	});

	Scenario('Recording watch progress on a video in the current community', ({ Given, When, Then, And }) => {
		Given('video "video-1" belongs to community "community-1"', () => belongsTo('video-1', 'community-1'));
		When('I record that 0 to 15 seconds of "video-1" were played', () => run(mutation('videoRecordProgress'), { input: { id: 'video-1', ranges: [{ start: 0, end: 15 }] } }));
		Then('the progress should be recorded for member "member-1"', () => {
			expect(viewingService.recordProgress).toHaveBeenCalledWith({ videoId: 'video-1', memberId: 'member-1', ranges: [{ start: 0, end: 15 }] });
		});
		And('the updated viewing should be returned', () => {
			expect(result).toEqual({ status: { success: true }, viewing: { id: 'viewing-1', videoId: 'video-1' } });
		});
	});

	Scenario('Recording where the player stopped', ({ Given, When, Then }) => {
		Given('video "video-1" belongs to community "community-1"', () => belongsTo('video-1', 'community-1'));
		When('I record that 0 to 15 seconds of "video-1" were played with the playhead at 12 seconds', () => run(mutation('videoRecordProgress'), { input: { id: 'video-1', ranges: [{ start: 0, end: 15 }], position: 12 } }));
		Then('the progress should be recorded with position 12', () => {
			expect(viewingService.recordProgress).toHaveBeenCalledWith({ videoId: 'video-1', memberId: 'member-1', ranges: [{ start: 0, end: 15 }], position: 12 });
		});
	});

	Scenario('Refusing watch progress on a video from another community', ({ Given, When, Then, And }) => {
		Given('video "video-9" belongs to community "community-2"', () => belongsTo('video-9', 'community-2'));
		When('I record that 0 to 15 seconds of "video-9" were played', () => run(mutation('videoRecordProgress'), { input: { id: 'video-9', ranges: [{ start: 0, end: 15 }] } }));
		Then('the result should fail with "Video not found"', () => {
			expect(result).toEqual({ status: { success: false, errorMessage: 'Video not found' } });
		});
		And('no progress should be recorded', () => {
			expect(viewingService.recordProgress).not.toHaveBeenCalled();
		});
	});

	Scenario('Refusing watch progress without a member', ({ Given, And, When, Then }) => {
		Given('video "video-1" belongs to community "community-1"', () => belongsTo('video-1', 'community-1'));
		And('a signed-in user whose request is not acting as a member', () => {
			memberId = undefined;
		});
		When('I record that 0 to 15 seconds of "video-1" were played', () => run(mutation('videoRecordProgress'), { input: { id: 'video-1', ranges: [{ start: 0, end: 15 }] } }));
		Then('the result should fail with "Unauthorized"', () => {
			expect(result).toEqual({ status: { success: false, errorMessage: 'Unauthorized' } });
			expect(viewingService.recordProgress).not.toHaveBeenCalled();
		});
	});

	Scenario("Resolving a video's viewings", ({ When, Then, And }) => {
		let mine: unknown;
		When('I resolve myViewing and viewings for video "video-1"', async () => {
			await run(field('Video', 'myViewing'), {}, { id: 'video-1' });
			mine = result;
			await run(field('Video', 'viewings'), {}, { id: 'video-1' });
		});
		Then('myViewing should be the caller\'s viewing as member "member-1"', () => {
			expect(viewingService.queryMine).toHaveBeenCalledWith({ videoId: 'video-1', memberId: 'member-1' });
			expect(mine).toEqual({ id: 'viewing-1', memberId: 'member-1' });
		});
		And('viewings should be the viewings the caller may see', () => {
			expect(viewingService.queryByVideo).toHaveBeenCalledWith({ videoId: 'video-1' });
			expect(result).toEqual([{ id: 'viewing-1' }, { id: 'viewing-2' }]);
		});
	});

	Scenario('Resolving myViewing without a member', ({ Given, When, Then }) => {
		Given('a signed-in user whose request is not acting as a member', () => {
			memberId = undefined;
		});
		When('I resolve myViewing for video "video-1"', () => run(field('Video', 'myViewing'), {}, { id: 'video-1' }));
		Then('myViewing should be null', () => {
			expect(result).toBeNull();
			expect(viewingService.queryMine).not.toHaveBeenCalled();
		});
	});

	Scenario("Resolving a viewing's member and unwatched spans", ({ Given, When, Then, And }) => {
		let viewing: { memberId: string; unwatchedRanges: { start: number; end: number }[] };
		let member: unknown;
		Given('a viewing by member "member-2" with 60 to 590 seconds unwatched', () => {
			viewing = { memberId: 'member-2', unwatchedRanges: [{ start: 60, end: 590 }] };
		});
		When("I resolve the viewing's member and unwatched fields", async () => {
			await run(field('VideoViewing', 'member'), {}, viewing);
			member = result;
			await run(field('VideoViewing', 'unwatched'), {}, viewing);
		});
		Then('the member should be looked up by id "member-2"', () => {
			expect(memberService.queryById).toHaveBeenCalledWith({ id: 'member-2' });
			expect(member).toEqual({ id: 'member-2', memberName: 'Pat' });
		});
		And('unwatched should be 60 to 590 seconds', () => {
			expect(result).toEqual([{ start: 60, end: 590 }]);
		});
	});

	Scenario('Resolving a viewing whose member cannot be loaded', ({ Given, When, Then }) => {
		Given('a viewing by a member who cannot be loaded', () => {
			memberService.queryById.mockRejectedValue(new Error('Member with id gone not found'));
			vi.spyOn(console, 'error').mockImplementation(() => undefined);
		});
		When("I resolve the viewing's member", () => run(field('VideoViewing', 'member'), {}, { memberId: 'gone' }));
		Then('the member should be null', () => {
			expect(caught).toBeUndefined();
			expect(result).toBeNull();
		});
	});
});
