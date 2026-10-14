import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import { expect } from 'vitest';
import type { Passport } from '../../passport.ts';
import type { VideoEntityReference } from '../video/video.aggregate.ts';
import type { VideoDomainPermissions } from '../video.domain-permissions.ts';
import { VideoViewing, type VideoViewingEntityReference, type VideoViewingProps } from './video-viewing.aggregate.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/video-viewing.aggregate.feature'));

const start = new Date('2026-10-07T12:00:00Z');
const after = (seconds: number) => new Date(start.getTime() + seconds * 1000);

/** A passport for a member of community-1, with the member visa's rules for video viewings. */
function makePassport(memberId: string, canManageSiteContent = false): Passport {
	return {
		video: {
			forVideoViewing: (root: VideoViewingEntityReference) => ({
				determineIf: (fn: (permissions: VideoDomainPermissions) => boolean) =>
					root.communityId === 'community-1' && fn({ canManageVideos: canManageSiteContent, canEncodeVideos: false, canViewVideos: true, isOwnVideoViewing: root.memberId === memberId, isSystemAccount: false }),
			}),
		},
	} as unknown as Passport;
}

function makeProps(overrides: Partial<VideoViewingProps> = {}): VideoViewingProps {
	return {
		id: 'viewing-1',
		communityId: '',
		videoId: '',
		memberId: '',
		durationSeconds: 0,
		bucketSeconds: 0,
		bucketCount: 0,
		watchedBuckets: [],
		watchedBucketCount: 0,
		creditSeconds: 0,
		lastReportAt: null,
		lastPositionSeconds: null,
		watchedThroughSeconds: null,
		completedAt: null,
		firstWatchReplays: [],
		postCompletionReplays: [],
		replaySessions: [],
		retiredReplaySessionIds: [],
		createdAt: start,
		updatedAt: start,
		schemaVersion: '1.0.0',
		...overrides,
	};
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let video: VideoEntityReference;
	let passport: Passport;
	let viewing: VideoViewing<VideoViewingProps>;
	let caught: unknown;
	let elapsed: number;

	const attempt = (action: () => unknown) => {
		caught = undefined;
		try {
			action();
		} catch (error) {
			caught = error;
		}
	};
	const startWatching = () => {
		viewing = VideoViewing.getNewInstance(makeProps(), video, 'member-1', start, passport);
		elapsed = 0;
	};
	const report = (ranges: { start: number; end: number }[], secondsLater: number, position?: number) => {
		elapsed += secondsLater;
		viewing.recordProgress(ranges, after(elapsed), position);
	};
	const reportReplays = (firstWatch: number[], sessionId: string, secondsLater: number, postCompletion: number[] = []) => {
		elapsed += secondsLater;
		viewing.recordProgress([], after(elapsed), undefined, { sessionId, firstWatch, postCompletion });
	};
	const reportEvery15SecondsUntil = (end: number) => {
		for (let position = 15; position < end; position += 15) {
			report([{ start: 0, end: position }], 15);
		}
		report([{ start: 0, end }], end - elapsed);
	};
	const expectError = (type: abstract new (...args: never[]) => Error, message: string) => {
		expect(caught).toBeInstanceOf(type);
		expect((caught as Error).message).toBe(message);
	};
	const loadAs = (memberId: string, canManageSiteContent: boolean) => {
		const props = makeProps({ communityId: 'community-1', videoId: 'video-1', memberId: 'member-1', durationSeconds: 600, bucketSeconds: 5, bucketCount: 120, creditSeconds: 30, lastReportAt: start });
		viewing = new VideoViewing(props, makePassport(memberId, canManageSiteContent));
	};

	BeforeEachScenario(() => {
		caught = undefined;
	});

	Background(({ Given, And }) => {
		Given('a ready 10-minute video in community "community-1"', () => {
			video = { id: 'video-1', status: 'READY', durationSeconds: 600, community: { id: 'community-1' } } as unknown as VideoEntityReference;
		});
		And('a passport for member "member-1" of that community', () => {
			passport = makePassport('member-1');
		});
	});

	Scenario('Starting a viewing', ({ When, Then, And }) => {
		When('member "member-1" starts watching the video', startWatching);
		Then('the viewing should have 120 buckets of 5 seconds', () => {
			expect([viewing.bucketCount, viewing.bucketSeconds, viewing.durationSeconds]).toEqual([120, 5, 600]);
			expect([viewing.communityId, viewing.videoId, viewing.memberId]).toEqual(['community-1', 'video-1', 'member-1']);
		});
		And('no buckets should be watched', () => {
			expect([viewing.watchedBucketCount, viewing.coverage]).toEqual([0, 0]);
			expect(viewing.watchedBuckets).toEqual([]);
		});
		And('the unwatched ranges should be 0 to 600 seconds', () => {
			expect(viewing.unwatchedRanges).toEqual([{ start: 0, end: 600 }]);
		});
		And('the viewing should not be complete', () => {
			expect(viewing.completedAt).toBeNull();
		});
		And('the viewing should have no last position', () => {
			expect(viewing.lastPositionSeconds).toBeNull();
		});
		And('it should be watched through 0 seconds', () => {
			expect(viewing.watchedThroughSeconds).toBe(0);
		});
	});

	Scenario('Starting a viewing for another member', ({ When, Then }) => {
		When('I try to start a viewing for member "member-2"', () => {
			attempt(() => VideoViewing.getNewInstance(makeProps(), video, 'member-2', start, passport));
		});
		Then('a PermissionError should be thrown with message "You can only record your own viewing of a video you can watch"', () => {
			expectError(PermissionError, 'You can only record your own viewing of a video you can watch');
		});
	});

	Scenario('Starting a viewing of a video that is not ready', ({ Given, When, Then }) => {
		Given('the video is still encoding', () => {
			video = { ...video, status: 'ENCODING', durationSeconds: null, community: { id: 'community-1' } } as unknown as VideoEntityReference;
		});
		When('I try to start a viewing for member "member-1"', () => {
			attempt(() => VideoViewing.getNewInstance(makeProps(), video, 'member-1', start, passport));
		});
		Then('an error should be thrown with message "Video video-1 is not ready to watch"', () => {
			expectError(Error, 'Video video-1 is not ready to watch');
		});
	});

	Scenario('Skipping from the first minute to the end', ({ Given, When, Then, And }) => {
		Given('member "member-1" started watching the video', startWatching);
		When('the player reports 0 to 60 seconds played, 60 seconds later', () => {
			report([{ start: 0, end: 60 }], 60);
		});
		And('the player reports 0 to 60 and 590 to 600 seconds played, 15 seconds later', () => {
			report(
				[
					{ start: 0, end: 60 },
					{ start: 590, end: 600 },
				],
				15,
			);
		});
		Then('14 of 120 buckets should be watched', () => {
			expect(viewing.watchedBucketCount).toBe(14);
			expect(viewing.coverage).toBeCloseTo(14 / 120);
		});
		And('the watched buckets should be 0 to 11 and 118 to 119', () => {
			expect(viewing.watchedBuckets).toEqual([
				{ start: 0, end: 11 },
				{ start: 118, end: 119 },
			]);
		});
		And('the unwatched ranges should be 60 to 590 seconds', () => {
			expect(viewing.unwatchedRanges).toEqual([{ start: 60, end: 590 }]);
		});
		And('the viewing should not be complete', () => {
			expect(viewing.completedAt).toBeNull();
		});
	});

	Scenario('Watching the whole video at normal speed', ({ Given, When, Then, And }) => {
		Given('member "member-1" started watching the video', startWatching);
		When('the player reports what it has played every 15 seconds until the end', () => {
			reportEvery15SecondsUntil(600);
		});
		Then('120 of 120 buckets should be watched', () => {
			expect(viewing.watchedBucketCount).toBe(120);
			expect(viewing.watchedBuckets).toEqual([{ start: 0, end: 119 }]);
			expect(viewing.unwatchedRanges).toEqual([]);
		});
		And('the viewing should be complete, at the report 600 seconds after starting', () => {
			expect(viewing.completedAt).toEqual(after(600));
		});
	});

	Scenario('Missing only the final seconds still completes the viewing', ({ Given, When, Then, And }) => {
		Given('member "member-1" started watching the video', startWatching);
		When('the player reports what it has played every 15 seconds until 590 seconds', () => {
			reportEvery15SecondsUntil(590);
		});
		Then('118 of 120 buckets should be watched', () => {
			expect(viewing.watchedBucketCount).toBe(118);
		});
		And('the viewing should be complete', () => {
			expect(viewing.completedAt).toEqual(after(590));
		});
	});

	Scenario('Reporting faster than real time', ({ Given, When, Then }) => {
		Given('member "member-1" started watching the video', startWatching);
		When('the player reports 0 to 600 seconds played, 10 seconds later', () => {
			report([{ start: 0, end: 600 }], 10);
		});
		Then('10 of 120 buckets should be watched', () => {
			expect(viewing.watchedBucketCount).toBe(10);
		});
		When('the player reports 0 to 600 seconds played, 60 seconds later', () => {
			report([{ start: 0, end: 600 }], 60);
		});
		Then('34 of 120 buckets should be watched', () => {
			expect(viewing.watchedBucketCount).toBe(34);
		});
	});

	Scenario('Leaving the video idle does not bank credit', ({ Given, When, Then }) => {
		Given('member "member-1" started watching the video', startWatching);
		When('the player reports 0 to 600 seconds played, 1 hour later', () => {
			report([{ start: 0, end: 600 }], 3600);
		});
		Then('24 of 120 buckets should be watched', () => {
			expect(viewing.watchedBucketCount).toBe(24);
		});
	});

	Scenario('Scrubbing across a bucket does not count it', ({ Given, When, Then }) => {
		Given('member "member-1" started watching the video', startWatching);
		When('the player reports 10 to 12.4 seconds played, 15 seconds later', () => {
			report([{ start: 10, end: 12.4 }], 15);
		});
		Then('0 of 120 buckets should be watched', () => {
			expect(viewing.watchedBucketCount).toBe(0);
		});
		When('the player reports 10 to 12.5 seconds played, 15 seconds later', () => {
			report([{ start: 10, end: 12.5 }], 15);
		});
		Then('1 of 120 buckets should be watched', () => {
			expect(viewing.watchedBucketCount).toBe(1);
			expect(viewing.watchedBuckets).toEqual([{ start: 2, end: 2 }]);
		});
	});

	Scenario('Reporting the same ranges again', ({ Given, When, Then, And }) => {
		Given('member "member-1" started watching the video', startWatching);
		When('the player reports 0 to 60 seconds played, 60 seconds later', () => {
			report([{ start: 0, end: 60 }], 60);
		});
		And('the player reports 0 to 60 seconds played, 15 seconds later', () => {
			report([{ start: 0, end: 60 }], 15);
		});
		Then('12 of 120 buckets should be watched', () => {
			expect(viewing.watchedBucketCount).toBe(12);
		});
	});

	Scenario('Ranges past the end are cut at the end', ({ Given, When, Then }) => {
		Given('member "member-1" started watching the video', startWatching);
		When('the player reports 595 to 700 seconds played, 15 seconds later', () => {
			report([{ start: 595, end: 700 }], 15);
		});
		Then('the watched buckets should be 119 to 119', () => {
			expect(viewing.watchedBuckets).toEqual([{ start: 119, end: 119 }]);
		});
	});

	Scenario('Invalid reports', ({ Given, When, Then }) => {
		Given('member "member-1" started watching the video', startWatching);
		When('the player reports a range that ends before it starts', () => {
			attempt(() => report([{ start: 30, end: 20 }], 15));
		});
		Then('an error should be thrown with message "A played range must end after it starts"', () => {
			expectError(Error, 'A played range must end after it starts');
		});
		When('the player reports 201 ranges', () => {
			attempt(() =>
				report(
					Array.from({ length: 201 }, (_, index) => ({ start: index, end: index + 0.5 })),
					15,
				),
			);
		});
		Then('an error should be thrown with message "A report can include at most 200 played ranges"', () => {
			expectError(Error, 'A report can include at most 200 played ranges');
		});
	});

	Scenario('Tracking how far the video was played without a gap', ({ Given, When, Then, And }) => {
		Given('member "member-1" started watching the video', startWatching);
		When('the player reports 0 to 13 seconds played, 15 seconds later', () => report([{ start: 0, end: 13 }], 15));
		Then('it should be watched through 13 seconds', () => {
			expect(viewing.watchedThroughSeconds).toBe(13);
		});
		And('the unwatched ranges should be 15 to 600 seconds', () => {
			expect(viewing.unwatchedRanges).toEqual([{ start: 15, end: 600 }]);
		});
		When('the player reports 0 to 13 and 13.6 to 25 seconds played, 15 seconds later', () =>
			report(
				[
					{ start: 0, end: 13 },
					{ start: 13.6, end: 25 },
				],
				15,
			),
		);
		Then('it should be watched through 25 seconds', () => {
			expect(viewing.watchedThroughSeconds).toBe(25);
		});
	});

	Scenario('Skipping ahead does not move how far the video was watched through', ({ Given, When, Then }) => {
		Given('member "member-1" started watching the video', startWatching);
		When('the player reports 0 to 13 and 40 to 50 seconds played, 30 seconds later', () =>
			report(
				[
					{ start: 0, end: 13 },
					{ start: 40, end: 50 },
				],
				30,
			),
		);
		Then('it should be watched through 13 seconds', () => {
			expect(viewing.watchedThroughSeconds).toBe(13);
		});
	});

	Scenario('How far the video was watched through stays near the credited buckets', ({ Given, When, Then, And }) => {
		Given('member "member-1" started watching the video', startWatching);
		When('the player reports 0 to 600 seconds played, 10 seconds later', () => report([{ start: 0, end: 600 }], 10));
		Then('10 of 120 buckets should be watched', () => {
			expect(viewing.watchedBucketCount).toBe(10);
		});
		And('it should be watched through 52.5 seconds', () => {
			expect(viewing.watchedThroughSeconds).toBe(52.5);
		});
	});

	Scenario('A viewing saved before this was tracked starts from its first unwatched part', ({ Given, When, Then }) => {
		Given('member "member-1"\'s viewing has buckets 0 to 11 watched and was saved before this was tracked', () => {
			const props = makeProps({
				communityId: 'community-1',
				videoId: 'video-1',
				memberId: 'member-1',
				durationSeconds: 600,
				bucketSeconds: 5,
				bucketCount: 120,
				watchedBuckets: [{ start: 0, end: 11 }],
				watchedBucketCount: 12,
				creditSeconds: 120,
				lastReportAt: start,
				watchedThroughSeconds: null,
			});
			viewing = new VideoViewing(props, passport);
			elapsed = 0;
		});
		When('the player reports 80 to 90 seconds played, 15 seconds later', () => report([{ start: 80, end: 90 }], 15));
		Then('it should be watched through 60 seconds', () => {
			expect(viewing.watchedThroughSeconds).toBe(60);
		});
		When('the player reports 60 to 70 seconds played, 15 seconds later', () => report([{ start: 60, end: 70 }], 15));
		Then('it should be watched through 70 seconds', () => {
			expect(viewing.watchedThroughSeconds).toBe(70);
		});
	});

	Scenario('Remembering where the player stopped', ({ Given, When, Then }) => {
		Given('member "member-1" started watching the video', startWatching);
		When('the player reports 0 to 13 seconds played with the playhead at 13 seconds, 15 seconds later', () => report([{ start: 0, end: 13 }], 15, 13));
		Then('the last position should be 13 seconds', () => {
			expect(viewing.lastPositionSeconds).toBe(13);
		});
		When('the player reports 0 to 13 seconds played with the playhead at 4 seconds, 15 seconds later', () => report([{ start: 0, end: 13 }], 15, 4));
		Then('the last position should be 4 seconds', () => {
			expect(viewing.lastPositionSeconds).toBe(4);
		});
		When('the player reports 0 to 13 seconds played without a position, 15 seconds later', () => report([{ start: 0, end: 13 }], 15));
		Then('the last position should still be 4 seconds', () => {
			expect(viewing.lastPositionSeconds).toBe(4);
		});
	});

	Scenario('A position past the end is cut at the end', ({ Given, When, Then }) => {
		Given('member "member-1" started watching the video', startWatching);
		When('the player reports 595 to 600 seconds played with the playhead at 700 seconds, 15 seconds later', () => report([{ start: 595, end: 600 }], 15, 700));
		Then('the last position should be 600 seconds', () => {
			expect(viewing.lastPositionSeconds).toBe(600);
		});
	});

	Scenario('Reporting a negative position', ({ Given, When, Then, And }) => {
		Given('member "member-1" started watching the video', startWatching);
		When('the player reports 0 to 13 seconds played with the playhead at -1 seconds', () => {
			attempt(() => report([{ start: 0, end: 13 }], 15, -1));
		});
		Then('an error should be thrown with message "The playhead position must be between 0 and 86400 seconds"', () => {
			expectError(Error, 'The playhead position must be between 0 and 86400 seconds');
		});
		And('the viewing should have no last position', () => {
			expect(viewing.lastPositionSeconds).toBeNull();
		});
	});

	Scenario("Recording another member's viewing", ({ Given, When, Then, And }) => {
		Given('member "member-2" of the community, who manages site content, loads member "member-1"\'s viewing', () => {
			loadAs('member-2', true);
		});
		When('they try to report 0 to 60 seconds played', () => {
			attempt(() => viewing.recordProgress([{ start: 0, end: 60 }], after(60)));
		});
		Then('a PermissionError should be thrown with message "You can only record your own viewing"', () => {
			expectError(PermissionError, 'You can only record your own viewing');
		});
		And('they should be able to see the viewing', () => {
			expect(viewing.canView()).toBe(true);
		});
	});

	Scenario("Seeing another member's viewing without managing site content", ({ Given, Then }) => {
		Given('member "member-2" of the community, who does not manage site content, loads member "member-1"\'s viewing', () => {
			loadAs('member-2', false);
		});
		Then('they should not be able to see the viewing', () => {
			expect(viewing.canView()).toBe(false);
		});
	});
	Scenario('Rewinding before the viewing is complete', ({ Given, When, And, Then }) => {
		Given('member "member-1" started watching the video', startWatching);
		When('the player reports 0 to 60 seconds played, 60 seconds later', () => {
			report([{ start: 0, end: 60 }], 60);
		});
		And('the player reports replay counts 0,2,1 for session "session-1", 60 seconds later', () => {
			reportReplays([0, 2, 1], 'session-1', 60);
		});
		Then('the first watch replays should be 0,2,1', () => {
			expect(viewing.firstWatchReplays.slice(0, 3)).toEqual([0, 2, 1]);
		});
		And('there should be no post completion replays', () => {
			expect(viewing.postCompletionReplays.some((count) => count > 0)).toBe(false);
		});
	});

	Scenario('Repeating a report does not count replays twice', ({ Given, When, And, Then }) => {
		Given('member "member-1" started watching the video', startWatching);
		When('the player reports 0 to 60 seconds played, 60 seconds later', () => {
			report([{ start: 0, end: 60 }], 60);
		});
		And('the player reports replay counts 0,2,1 for session "session-1", 60 seconds later', () => {
			reportReplays([0, 2, 1], 'session-1', 60);
		});
		And('the player sends that same report again, 60 seconds later', () => {
			reportReplays([0, 2, 1], 'session-1', 60);
		});
		Then('the first watch replays should be 0,2,1', () => {
			expect(viewing.firstWatchReplays.slice(0, 3)).toEqual([0, 2, 1]);
		});
	});

	Scenario('A later report in the same session counts only what is new', ({ Given, When, And, Then }) => {
		Given('member "member-1" started watching the video', startWatching);
		When('the player reports 0 to 60 seconds played, 60 seconds later', () => {
			report([{ start: 0, end: 60 }], 60);
		});
		And('the player reports replay counts 0,2,1 for session "session-1", 60 seconds later', () => {
			reportReplays([0, 2, 1], 'session-1', 60);
		});
		And('the player reports replay counts 0,5,1 for session "session-1", 60 seconds later', () => {
			reportReplays([0, 5, 1], 'session-1', 60);
		});
		Then('the first watch replays should be 0,5,1', () => {
			expect(viewing.firstWatchReplays.slice(0, 3)).toEqual([0, 5, 1]);
		});
	});

	Scenario('A new session counts its replays in full', ({ Given, When, And, Then }) => {
		Given('member "member-1" started watching the video', startWatching);
		When('the player reports 0 to 60 seconds played, 60 seconds later', () => {
			report([{ start: 0, end: 60 }], 60);
		});
		And('the player reports replay counts 0,2,1 for session "session-1", 60 seconds later', () => {
			reportReplays([0, 2, 1], 'session-1', 60);
		});
		And('the player reports replay counts 0,3,0 for session "session-2", 60 seconds later', () => {
			reportReplays([0, 3, 0], 'session-2', 60);
		});
		Then('the first watch replays should be 0,5,1', () => {
			expect(viewing.firstWatchReplays.slice(0, 3)).toEqual([0, 5, 1]);
		});
	});

	Scenario('Replays after the viewing is complete count separately', ({ Given, When, Then, And }) => {
		Given('member "member-1" watched the whole video', () => {
			startWatching();
			reportEvery15SecondsUntil(600);
		});
		When('the player reports return-visit counts 4,0,0 for session "session-2", 60 seconds later', () => {
			reportReplays([], 'session-2', 60, [4, 0, 0]);
		});
		Then('the post completion replays should be 4,0,0', () => {
			expect(viewing.postCompletionReplays.slice(0, 3)).toEqual([4, 0, 0]);
		});
		And('there should be no first watch replays', () => {
			expect(viewing.firstWatchReplays.some((count) => count > 0)).toBe(false);
		});
	});

	Scenario('Replays beyond the elapsed real time wait for the next report', ({ Given, When, And, Then }) => {
		Given('member "member-1" started watching the video', startWatching);
		When('the player reports 0 to 60 seconds played, 60 seconds later', () => {
			report([{ start: 0, end: 60 }], 60);
		});
		And('the player reports replay counts 0,40 for session "session-1", 5 seconds later', () => {
			reportReplays([0, 40], 'session-1', 5);
		});
		Then('the first watch replays should be 0,15', () => {
			expect(viewing.firstWatchReplays.slice(0, 2)).toEqual([0, 15]);
		});
		When('the player reports replay counts 0,40 for session "session-1", 20 seconds later', () => {
			reportReplays([0, 40], 'session-1', 20);
		});
		Then('the first watch replays should be 0,35', () => {
			expect(viewing.firstWatchReplays.slice(0, 2)).toEqual([0, 35]);
		});
	});

	Scenario('A replay count that is not a whole number', ({ Given, When, Then }) => {
		Given('member "member-1" started watching the video', startWatching);
		When('the player reports replay counts 0,1.5 for session "session-1", 60 seconds later', () => {
			attempt(() => {
				reportReplays([0, 1.5], 'session-1', 60);
			});
		});
		Then('an error should be thrown with message "Replay count for bucket 1 must be a whole number between 0 and 10000"', () => {
			expectError(Error, 'Replay count for bucket 1 must be a whole number between 0 and 10000');
		});
	});
	Scenario('Two sessions reporting in turn', ({ Given, When, And, Then }) => {
		Given('member "member-1" started watching the video', startWatching);
		When('the player reports 0 to 60 seconds played, 60 seconds later', () => {
			report([{ start: 0, end: 60 }], 60);
		});
		And('the player reports replay counts 0,2 for session "session-1", 60 seconds later', () => {
			reportReplays([0, 2], 'session-1', 60);
		});
		And('the player reports replay counts 0,1 for session "session-2", 60 seconds later', () => {
			reportReplays([0, 1], 'session-2', 60);
		});
		And('session "session-1" reports its counts 0,2 again, 60 seconds later', () => {
			reportReplays([0, 2], 'session-1', 60);
		});
		Then('the first watch replays should be 0,3', () => {
			expect(viewing.firstWatchReplays.slice(0, 2)).toEqual([0, 3]);
		});
	});
	Scenario('Replay counts past the end of the video do not stop progress saving', ({ Given, When, Then, And }) => {
		Given('member "member-1" started watching the video', startWatching);
		When('the player reports 0 to 60 seconds played with replay counts for 200 parts, 60 seconds later', () => {
			const counts = new Array(200).fill(0);
			counts[150] = 1;
			elapsed += 60;
			attempt(() => viewing.recordProgress([{ start: 0, end: 60 }], after(elapsed), undefined, { sessionId: 'session-1', firstWatch: counts, postCompletion: [] }));
		});
		Then('12 of 120 buckets should be watched', () => {
			expect(caught).toBeUndefined();
			expect(viewing.watchedBucketCount).toBe(12);
		});
		And("the replay counts should cover only the video's 120 parts", () => {
			expect(viewing.firstWatchReplays.length).toBeLessThanOrEqual(120);
		});
	});

	Scenario('A report that arrives late does not move the last report time back', ({ Given, When, And, Then }) => {
		Given('member "member-1" started watching the video', startWatching);
		When('the player reports 0 to 60 seconds played with the playhead at 60 seconds, 60 seconds later', () => {
			report([{ start: 0, end: 60 }], 60, 60);
		});
		And('a report made 30 seconds earlier arrives', () => {
			viewing.recordProgress([{ start: 0, end: 30 }], after(30), 30);
		});
		Then('the last report time should still be 60 seconds after the start', () => {
			expect(viewing.lastReportAt).toEqual(after(60));
		});
		And('the resume position should still be 60 seconds', () => {
			expect(viewing.lastPositionSeconds).toBe(60);
		});
	});
	Scenario('Rewinds counted before completion stay rewinds when credited after it', ({ Given, When, Then, And }) => {
		Given('member "member-1" watched the whole video', () => {
			startWatching();
			reportEvery15SecondsUntil(600);
		});
		When('the player reports rewind counts 0,3 it counted before completion, 60 seconds later', () => {
			reportReplays([0, 3], 'session-1', 60);
		});
		Then('the first watch replays should be 0,3', () => {
			expect(viewing.firstWatchReplays.slice(0, 2)).toEqual([0, 3]);
		});
		And('there should be no post completion replays', () => {
			expect(viewing.postCompletionReplays.some((count) => count > 0)).toBe(false);
		});
	});

	Scenario('A session retired after newer ones report credits nothing more', ({ Given, When, And, Then }) => {
		Given('member "member-1" started watching the video', startWatching);
		When('the player reports 0 to 60 seconds played, 60 seconds later', () => {
			report([{ start: 0, end: 60 }], 60);
		});
		And('session "session-0" reports replay counts 0,1, then six newer sessions each report 0,1, 60 seconds apart', () => {
			for (const sessionId of ['session-0', 'session-1', 'session-2', 'session-3', 'session-4', 'session-5', 'session-6']) {
				reportReplays([0, 1], sessionId, 60);
			}
		});
		And('session "session-0" reports its counts 0,1 again, 60 seconds later', () => {
			reportReplays([0, 1], 'session-0', 60);
		});
		Then('the first watch replays should be 0,7', () => {
			expect(viewing.firstWatchReplays.slice(0, 2)).toEqual([0, 7]);
			expect(viewing.retiredReplaySessionIds).toContain('session-0');
		});
	});
});
