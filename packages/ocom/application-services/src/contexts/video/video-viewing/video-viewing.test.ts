import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { expect, vi } from 'vitest';
import { VideoViewing, type VideoViewingApplicationService } from './index.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/video-viewing.feature'));

type Viewing = Domain.Contexts.Video.VideoViewing.VideoViewingEntityReference;

const makeViewing = (memberId: string, visible = true) => ({ memberId, recordProgress: vi.fn(), canView: vi.fn(() => visible) });

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
	let video: { id: string } | null;
	let stored: ReturnType<typeof makeViewing> | undefined;
	let created: ReturnType<typeof makeViewing>;
	let raceOnFirstSave: boolean;
	let readOne: ReturnType<typeof makeViewing> | null;
	let readMany: ReturnType<typeof makeViewing>[];
	let repo: { getByVideoAndMember: ReturnType<typeof vi.fn>; getNewInstance: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn> };
	let service: VideoViewingApplicationService;
	let result: unknown;
	let caught: unknown;

	const build = () => {
		const dataSources = {
			readonlyDataSource: {
				Video: {
					Video: { VideoReadRepo: { getById: vi.fn(async () => video) } },
					VideoViewing: { VideoViewingReadRepo: { getByVideoAndMember: vi.fn(async () => readOne), getByVideoId: vi.fn(async () => readMany) } },
				},
			},
			domainDataSource: {
				Video: { VideoViewing: { VideoViewingUnitOfWork: { withScopedTransaction: vi.fn(async (fn: (r: typeof repo) => Promise<void>) => fn(repo)) } } },
			},
		} as unknown as DataSources;
		return VideoViewing(dataSources);
	};

	const report = (end: number) => async () => {
		try {
			result = await build().recordProgress({ videoId: 'video-1', memberId: 'member-1', ranges: [{ start: 0, end }] });
		} catch (error) {
			caught = error;
		}
	};

	BeforeEachScenario(() => {
		video = { id: 'video-1' };
		stored = undefined;
		created = makeViewing('member-1');
		raceOnFirstSave = false;
		readOne = null;
		readMany = [];
		result = undefined;
		caught = undefined;
		repo = {
			getByVideoAndMember: vi.fn(async () => stored),
			getNewInstance: vi.fn(async () => created),
			save: vi.fn((saved: unknown) => {
				if (raceOnFirstSave) {
					raceOnFirstSave = false;
					stored = makeViewing('member-1');
					return Promise.reject(Object.assign(new Error('E11000 duplicate key error'), { code: 11000 }));
				}
				return Promise.resolve(saved);
			}),
		};
	});

	Scenario('Building the video viewing application service', ({ When, Then }) => {
		When('I build the VideoViewing application service', () => {
			service = build();
		});
		Then('it should expose recordProgress, queryMine, and queryByVideo', () => {
			expect([typeof service.recordProgress, typeof service.queryMine, typeof service.queryByVideo]).toEqual(['function', 'function', 'function']);
		});
	});

	Scenario("The first report starts the member's viewing", ({ Given, When, Then, And }) => {
		Given('a ready video the member has not started watching', () => {
			stored = undefined;
		});
		When("the member's player reports 0 to 15 seconds played", report(15));
		Then('a new viewing should be started for that video and member', () => {
			expect(caught).toBeUndefined();
			expect(repo.getNewInstance).toHaveBeenCalledWith(video, 'member-1', expect.any(Date));
		});
		And('the report should be recorded on it and saved', () => {
			expect(created.recordProgress).toHaveBeenCalledWith([{ start: 0, end: 15 }], expect.any(Date));
			expect(repo.save).toHaveBeenCalledWith(created);
			expect(result).toBe(created);
		});
	});

	Scenario("Later reports update the member's viewing", ({ Given, When, Then, And }) => {
		Given('a ready video the member has started watching', () => {
			stored = makeViewing('member-1');
		});
		When("the member's player reports 0 to 30 seconds played", report(30));
		Then('the existing viewing should record the report and be saved', () => {
			expect(stored?.recordProgress).toHaveBeenCalledWith([{ start: 0, end: 30 }], expect.any(Date));
			expect(repo.save).toHaveBeenCalledWith(stored);
		});
		And('no new viewing should be started', () => {
			expect(repo.getNewInstance).not.toHaveBeenCalled();
		});
	});

	Scenario('Two first reports race to start the viewing', ({ Given, And, When, Then }) => {
		Given('a ready video the member has not started watching', () => {
			stored = undefined;
		});
		And('another report starts the viewing while this one is saving', () => {
			raceOnFirstSave = true;
		});
		When("the member's player reports 0 to 15 seconds played", report(15));
		Then('the report should be retried and recorded on the viewing the other report started', () => {
			expect(caught).toBeUndefined();
			expect(stored?.recordProgress).toHaveBeenCalledWith([{ start: 0, end: 15 }], expect.any(Date));
			expect(result).toBe(stored);
			expect(repo.save).toHaveBeenCalledTimes(2);
		});
	});

	Scenario('Reporting progress on a video that does not exist', ({ Given, When, Then }) => {
		Given('no video with that id', () => {
			video = null;
		});
		When("the member's player reports 0 to 15 seconds played", report(15));
		Then('it should fail with "Video not found"', () => {
			expect((caught as Error).message).toBe('Video not found');
			expect(repo.save).not.toHaveBeenCalled();
		});
	});

	Scenario("Getting the caller's own viewing", ({ Given, When, Then }) => {
		Given("the read repository has the member's viewing, which the caller may see", () => {
			readOne = makeViewing('member-1');
		});
		When("I query the caller's viewing of the video", async () => {
			result = await build().queryMine({ videoId: 'video-1', memberId: 'member-1' });
		});
		Then('I should receive it', () => {
			expect(result).toBe(readOne);
		});
	});

	Scenario('Getting a viewing the caller may not see', ({ Given, When, Then }) => {
		Given('the read repository has a viewing the caller may not see', () => {
			readOne = makeViewing('member-1', false);
		});
		When("I query the caller's viewing of the video", async () => {
			result = await build().queryMine({ videoId: 'video-1', memberId: 'member-1' });
		});
		Then('I should receive null', () => {
			expect(result).toBeNull();
		});
	});

	Scenario("Listing a video's viewings", ({ Given, When, Then }) => {
		Given('the read repository has two viewings, of which the caller may see one', () => {
			readMany = [makeViewing('member-1'), makeViewing('member-2', false)];
		});
		When("I query the video's viewings", async () => {
			result = await build().queryByVideo({ videoId: 'video-1' });
		});
		Then('I should receive only the viewing the caller may see', () => {
			expect((result as Viewing[]).map((viewing) => viewing.memberId)).toEqual(['member-1']);
		});
	});
});
