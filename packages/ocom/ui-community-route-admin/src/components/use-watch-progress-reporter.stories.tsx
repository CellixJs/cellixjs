import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { type PlayedRange, type ReplayReport, type ReporterTiming, useWatchProgressReporter, type WatchHistory } from './use-watch-progress-reporter.ts';

/** Matches any session id, which the hook generates. */
const anySession = { sessionId: expect.any(String), firstWatch: [], postCompletion: [] };

/** Short delays, so stories can see a retry or a later report without waiting seconds. */
const quickTiming = (overrides: Partial<ReporterTiming>): ReporterTiming => ({ firstRetryMs: 1_000, maxRetryMs: 1_000, trailingReportMs: 60_000, ...overrides });

/** A stand-in for a video element: its played spans, playhead, and paused state can be set directly. */
class FakeVideoElement extends EventTarget {
	paused = true;
	seeking = false;
	currentTime = 0;
	private spans: [number, number][] = [];

	/** @param alreadyPlayed - Spans played before the reporter starts, as when the player starts before the viewing loads. */
	constructor(alreadyPlayed: [number, number][] = []) {
		super();
		this.spans = alreadyPlayed;
		this.currentTime = alreadyPlayed.at(-1)?.[1] ?? 0;
	}

	get played() {
		const spans = this.spans;
		return { length: spans.length, start: (index: number) => spans[index]?.[0] ?? 0, end: (index: number) => spans[index]?.[1] ?? 0 };
	}

	/**
	 * Plays the spans, moving the playhead through them a second at a time as a
	 * browser does, and leaves it at the end of the last one.
	 */
	play(spans: [number, number][]) {
		this.spans = spans;
		this.paused = false;
		this.dispatchEvent(new Event('play'));
		for (const [start, end] of spans) {
			for (let time = start; time <= end; time++) {
				this.currentTime = time;
				this.dispatchEvent(new Event('timeupdate'));
			}
		}
		this.currentTime = spans.at(-1)?.[1] ?? 0;
	}

	/** Moves the playhead while playing, as a browser does between frames. */
	advanceTo(...times: number[]) {
		for (const time of times) {
			this.currentTime = time;
			this.dispatchEvent(new Event('timeupdate'));
		}
	}

	/** Jumps the playhead, as the seek bar does. */
	seekTo(time: number) {
		this.seeking = true;
		this.dispatchEvent(new Event('seeking'));
		this.seeking = false;
		this.currentTime = time;
	}

	pause() {
		this.paused = true;
		this.dispatchEvent(new Event('pause'));
	}

	end() {
		this.paused = true;
		this.dispatchEvent(new Event('ended'));
	}
}

type HarnessProps = { element: FakeVideoElement; report: (ranges: PlayedRange[], position: number, replay: ReplayReport) => Promise<boolean>; history?: WatchHistory; timing?: ReporterTiming };

const Reporter: React.FC<HarnessProps> = ({ element, report, history, timing }) => {
	useWatchProgressReporter(element as unknown as HTMLVideoElement, report, history, timing);
	return <span>Reporting</span>;
};

/** Renders the reporter until "Leave the page" is clicked, which unmounts it. */
const WatchProgressHarness: React.FC<HarnessProps> = (props) => {
	const [mounted, setMounted] = useState(true);
	return (
		<div>
			{mounted ? <Reporter {...props} /> : null}
			<button
				type="button"
				onClick={() => setMounted(false)}
			>
				Leave the page
			</button>
		</div>
	);
};

const meta: Meta<typeof WatchProgressHarness> = {
	title: 'Admin/Hooks/useWatchProgressReporter',
	component: WatchProgressHarness,
};

export default meta;
type Story = StoryObj<typeof meta>;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const ReportsWhenPlaybackPauses: Story = {
	args: { element: new FakeVideoElement(), report: fn(async () => true) },
	play: async ({ args }) => {
		args.element.play([
			[0, 60],
			[590, 600],
		]);
		args.element.pause();
		await waitFor(() =>
			expect(args.report).toHaveBeenCalledWith(
				[
					{ start: 0, end: 60 },
					{ start: 590, end: 600 },
				],
				600,
				anySession,
			),
		);
	},
};

export const DoesNotRepeatAReportThatWasSaved: Story = {
	args: { element: new FakeVideoElement(), report: fn(async () => true) },
	play: async ({ args }) => {
		args.element.play([[0, 30]]);
		args.element.pause();
		await waitFor(() => expect(args.report).toHaveBeenCalledTimes(1));
		args.element.end();
		await new Promise((resolve) => setTimeout(resolve, 50));
		await expect(args.report).toHaveBeenCalledTimes(1);
	},
};

/** A failed report is sent again in the same session with the same counts, so the server does not count its replays twice. */
export const SendsAgainAfterAFailedReport: Story = {
	args: { element: new FakeVideoElement(), report: fn(async () => false) },
	play: async ({ args }) => {
		args.element.play([[0, 30]]);
		args.element.seekTo(5);
		args.element.advanceTo(5, 9);
		args.element.pause();
		await waitFor(() => expect(args.report).toHaveBeenCalledTimes(1));
		args.element.end();
		await waitFor(() => expect(args.report).toHaveBeenCalledTimes(2));
		const [first, retry] = args.report.mock.calls.map((call) => call[2]);
		await expect(first).toEqual({ sessionId: expect.any(String), firstWatch: [0, 1], postCompletion: [] });
		await expect(retry).toEqual(first);
	},
};

export const ReportsWhenLeavingThePage: Story = {
	args: { element: new FakeVideoElement(), report: fn(async () => true) },
	play: async ({ args, canvasElement }) => {
		args.element.play([[0, 45]]);
		await userEvent.click(within(canvasElement).getByRole('button', { name: 'Leave the page' }));
		await waitFor(() => expect(args.report).toHaveBeenCalledWith([{ start: 0, end: 45 }], 45, anySession));
	},
};

/** Going back without playing changes only the playhead, which is still worth saving so the member resumes there. */
export const ReportsAMovedPlayhead: Story = {
	args: { element: new FakeVideoElement(), report: fn(async () => true) },
	play: async ({ args, canvasElement }) => {
		args.element.play([[0, 30]]);
		args.element.pause();
		await waitFor(() => expect(args.report).toHaveBeenCalledWith([{ start: 0, end: 30 }], 30, anySession));
		args.element.currentTime = 10;
		await userEvent.click(within(canvasElement).getByRole('button', { name: 'Leave the page' }));
		await waitFor(() => expect(args.report).toHaveBeenLastCalledWith([{ start: 0, end: 30 }], 10, anySession));
	},
};

export const SkipsReportsBeforeAnythingIsPlayed: Story = {
	args: { element: new FakeVideoElement(), report: fn(async () => true) },
	play: async ({ args }) => {
		args.element.pause();
		await new Promise((resolve) => setTimeout(resolve, 50));
		await expect(args.report).not.toHaveBeenCalled();
	},
};

/** Rewinding and playing again counts each part played over a second time, once. */
export const CountsBucketsPlayedAgainAfterRewinding: Story = {
	args: { element: new FakeVideoElement(), report: fn(async () => true) },
	play: async ({ args }) => {
		args.element.play([[0, 60]]);
		args.element.seekTo(10);
		args.element.advanceTo(10, 12, 16, 18);
		args.element.pause();
		await waitFor(() => expect(args.report).toHaveBeenLastCalledWith(expect.anything(), 18, { sessionId: expect.any(String), firstWatch: [0, 0, 1, 1], postCompletion: [] }));
	},
};

/** Playing forward for the first time is not a replay, though the playhead reaches each part several times. */
export const CountsNoReplaysOnAFirstWatch: Story = {
	args: { element: new FakeVideoElement(), report: fn(async () => true) },
	play: async ({ args }) => {
		args.element.play([[0, 30]]);
		args.element.pause();
		await waitFor(() => expect(args.report).toHaveBeenLastCalledWith(expect.anything(), 30, anySession));
	},
};

/** Skipping ahead and then going back to a part never played is not a replay. */
export const CountsNoReplaysForPartsSkippedOver: Story = {
	args: { element: new FakeVideoElement(), report: fn(async () => true) },
	play: async ({ args }) => {
		args.element.play([[0, 10]]);
		args.element.seekTo(100);
		args.element.advanceTo(100, 104);
		args.element.seekTo(50);
		args.element.advanceTo(50, 54);
		args.element.pause();
		await waitFor(() => expect(args.report).toHaveBeenLastCalledWith(expect.anything(), 54, anySession));
	},
};

/** A playhead that crosses back and forth over a part's edge counts each part once. */
export const CountsAPartOnceWhenThePlayheadJittersAcrossItsEdge: Story = {
	args: { element: new FakeVideoElement(), report: fn(async () => true) },
	play: async ({ args }) => {
		args.element.play([[0, 20]]);
		args.element.seekTo(8);
		args.element.advanceTo(9.9, 10.1, 9.9, 10.1, 12);
		args.element.pause();
		await waitFor(() => expect(args.report).toHaveBeenLastCalledWith(expect.anything(), 12, { sessionId: expect.any(String), firstWatch: [0, 1, 1], postCompletion: [] }));
	},
};

/** After a reload, resuming at the first part not yet watched and playing on is not a replay. */
export const CountsNoReplaysWhenResumingAfterAReload: Story = {
	args: { element: new FakeVideoElement(), report: fn(async () => true), history: { unwatched: [{ start: 300, end: 600 }], completed: false } },
	play: async ({ args }) => {
		args.element.play([[300, 310]]);
		args.element.pause();
		await waitFor(() => expect(args.report).toHaveBeenLastCalledWith(expect.anything(), 310, anySession));
	},
};

/** After a reload, playing a part an earlier sitting watched is a replay, so the resume story above depends on the history being passed in. */
export const CountsReplaysOfPartsAnEarlierSittingWatched: Story = {
	args: { element: new FakeVideoElement(), report: fn(async () => true), history: { unwatched: [{ start: 300, end: 600 }], completed: false } },
	play: async ({ args }) => {
		args.element.play([[0, 10]]);
		args.element.pause();
		await waitFor(() => expect(args.report).toHaveBeenLastCalledWith(expect.anything(), 10, { sessionId: expect.any(String), firstWatch: [1, 1, 1], postCompletion: [] }));
	},
};

/** Parts beyond a gap that an earlier sitting watched are replays too, not only the run from the start. */
export const CountsReplaysOfPartsWatchedBeyondAGap: Story = {
	args: { element: new FakeVideoElement(), report: fn(async () => true), history: { unwatched: [{ start: 60, end: 120 }], completed: false } },
	play: async ({ args }) => {
		args.element.seekTo(130);
		args.element.play([[130, 134]]);
		args.element.pause();
		await waitFor(() => expect(args.report).toHaveBeenLastCalledWith(expect.anything(), 134, { sessionId: expect.any(String), firstWatch: [...new Array(26).fill(0), 1], postCompletion: [] }));
	},
};

/** A last part shorter than the others, never watched, is not a replay when first played. */
export const CountsNoReplayForAShortLastPartPlayedFirstTime: Story = {
	args: { element: new FakeVideoElement(), report: fn(async () => true), history: { unwatched: [{ start: 115, end: 117.5 }], completed: false } },
	play: async ({ args }) => {
		args.element.play([[115, 117]]);
		args.element.pause();
		await waitFor(() => expect(args.report).toHaveBeenLastCalledWith(expect.anything(), 117, anySession));
	},
};

/** Once the member has finished the video, going back to a part is a return visit, not a rewind. */
export const CountsReplaysAfterFinishingAsReturnVisits: Story = {
	args: { element: new FakeVideoElement(), report: fn(async () => true), history: { unwatched: [], completed: true } },
	play: async ({ args }) => {
		args.element.play([[0, 10]]);
		args.element.pause();
		await waitFor(() => expect(args.report).toHaveBeenLastCalledWith(expect.anything(), 10, { sessionId: expect.any(String), firstWatch: [], postCompletion: [1, 1, 1] }));
	},
};

/** Starts reporting only once "Viewing loaded" is clicked, passing a placeholder history until then, as the page does while its queries load. */
const LoadingReporter: React.FC<HarnessProps> = ({ element, report, history, timing }) => {
	const [loaded, setLoaded] = useState(false);
	useWatchProgressReporter(loaded ? (element as unknown as HTMLVideoElement) : undefined, report, loaded ? history : { unwatched: null, completed: false }, timing);
	return (
		<button
			type="button"
			onClick={() => setLoaded(true)}
		>
			Viewing loaded
		</button>
	);
};

/** A placeholder history passed while the viewing loads is not kept, so a return visit to a finished video still counts its replays. */
export const ReadsHistoryOnlyOnceReportingStarts: Story = {
	args: { element: new FakeVideoElement(), report: fn(async () => true), history: { unwatched: [], completed: true } },
	render: (args) => <LoadingReporter {...args} />,
	play: async ({ args, canvasElement }) => {
		await userEvent.click(within(canvasElement).getByRole('button', { name: 'Viewing loaded' }));
		args.element.play([[0, 10]]);
		args.element.pause();
		await waitFor(() => expect(args.report).toHaveBeenLastCalledWith(expect.anything(), 10, { sessionId: expect.any(String), firstWatch: [], postCompletion: [1, 1, 1] }));
	},
};

/** Play before the reporter starts, as while the viewing loads, belongs to the first pass, so going back to it is a replay. */
export const CountsReplaysOfPlayBeforeTheReporterStarted: Story = {
	args: { element: new FakeVideoElement([[0, 20]]), report: fn(async () => true) },
	play: async ({ args }) => {
		args.element.seekTo(5);
		args.element.paused = false;
		args.element.advanceTo(5, 9);
		args.element.pause();
		await waitFor(() => expect(args.report).toHaveBeenLastCalledWith(expect.anything(), 9, { sessionId: expect.any(String), firstWatch: [0, 1], postCompletion: [] }));
	},
};

/** Makes the next report fail, then lets later ones succeed. */
const nextReportFails = { pending: false };

/** A report that fails after playback stops is tried again, so it is not left unsent. */
export const RetriesAReportThatFailedAfterPlaybackStopped: Story = {
	args: {
		element: new FakeVideoElement(),
		report: fn(() => {
			const fails = nextReportFails.pending;
			nextReportFails.pending = false;
			return Promise.resolve(!fails);
		}),
		timing: quickTiming({ firstRetryMs: 20 }),
	},
	play: async ({ args }) => {
		nextReportFails.pending = true;
		args.element.play([[0, 10]]);
		args.element.pause();
		await waitFor(() => expect(args.report).toHaveBeenCalledTimes(2));
		await wait(100);
		await expect(args.report).toHaveBeenCalledTimes(2);
	},
};

/** Replay counts are sent once more after playback stops, so counts the API could not credit yet are credited later. */
export const SendsReplayCountsOnceMoreAfterPlaybackStops: Story = {
	args: { element: new FakeVideoElement(), report: fn(async () => true), timing: quickTiming({ trailingReportMs: 20 }) },
	play: async ({ args }) => {
		args.element.play([[0, 20]]);
		args.element.seekTo(5);
		args.element.advanceTo(5, 9);
		args.element.pause();
		await waitFor(() => expect(args.report).toHaveBeenCalledTimes(2));
		const [first, again] = args.report.mock.calls.map((call) => call[2]);
		await expect(again).toEqual(first);
		await wait(100);
		await expect(args.report).toHaveBeenCalledTimes(2);
	},
};

/** Without replays there is nothing for a later report to credit, so none is sent. */
export const SendsNothingMoreAfterStoppingWithoutReplays: Story = {
	args: { element: new FakeVideoElement(), report: fn(async () => true), timing: quickTiming({ trailingReportMs: 20 }) },
	play: async ({ args }) => {
		args.element.play([[0, 20]]);
		args.element.pause();
		await waitFor(() => expect(args.report).toHaveBeenCalledTimes(1));
		await wait(100);
		await expect(args.report).toHaveBeenCalledTimes(1);
	},
};
