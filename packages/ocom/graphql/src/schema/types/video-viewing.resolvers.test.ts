import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import type { GraphContext } from '../context.ts';
import videoViewingResolvers from './video-viewing.resolvers.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/video-viewing.resolvers.feature'));

type Resolver = (parent: unknown, args: unknown, context: GraphContext, info: unknown) => Promise<unknown>;
const mutation = (name: string) => (videoViewingResolvers.Mutation as Record<string, unknown>)[name] as Resolver;
const field = (type: 'Video' | 'VideoViewing', name: string) => (videoViewingResolvers[type] as Record<string, unknown>)[name] as Resolver;

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let videos: Record<string, { id: string; community: { id: string } }>;
	let communityId: string | undefined;
	let videoService: { queryById: ReturnType<typeof vi.fn> };
	let viewingService: Record<'recordProgress' | 'queryMine' | 'queryByVideo', ReturnType<typeof vi.fn>>;
	let memberService: { queryById: ReturnType<typeof vi.fn> };
	let memberId: string | undefined;
	let result: unknown;
	let caught: unknown;

	const context = () =>
		({
			applicationServices: {
				Video: { Video: videoService, VideoViewing: viewingService },
				Community: { Member: memberService },
				verifiedUser: { verifiedJwt: { sub: 'user-1' }, hints: { communityId, memberId } },
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
		memberId = 'member-1';
		videoService = { queryById: vi.fn(async ({ id }: { id: string }) => videos[id] ?? null) };
		viewingService = {
			recordProgress: vi.fn(async ({ videoId }: { videoId: string }) => ({ id: 'viewing-1', videoId })),
			queryMine: vi.fn(async ({ memberId: id }: { memberId: string }) => ({ id: 'viewing-1', memberId: id })),
			queryByVideo: vi.fn(async () => [{ id: 'viewing-1' }, { id: 'viewing-2' }]),
		};
		memberService = { queryById: vi.fn(async ({ id }: { id: string }) => ({ id, memberName: 'Pat' })) };
		result = undefined;
		caught = undefined;
	});

	Background(({ Given }) => {
		Given('a signed-in member whose request is scoped to community "community-1"', () => {
			communityId = 'community-1';
		});
	});

	const belongsTo = (videoId: string, community: string) => {
		videos[videoId] = { id: videoId, community: { id: community } };
	};

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
