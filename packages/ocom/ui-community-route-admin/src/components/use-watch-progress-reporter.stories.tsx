import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { type PlayedRange, type ReplayReport, useWatchProgressReporter } from './use-watch-progress-reporter.ts';

/** Matches any session id, which the hook generates. */
const anySession = { sessionId: expect.any(String), counts: [] };

/** A stand-in for a video element: its played spans, playhead, and paused state can be set directly. */
class FakeVideoElement extends EventTarget {
	paused = true;
	seeking = false;
	currentTime = 0;
	private spans: [number, number][] = [];

	get played() {
		const spans = this.spans;
		return { length: spans.length, start: (index: number) => spans[index]?.[0] ?? 0, end: (index: number) => spans[index]?.[1] ?? 0 };
	}

	/** Plays the spans, leaving the playhead at the end of the last one. */
	play(spans: [number, number][]) {
		this.spans = spans;
		this.currentTime = spans.at(-1)?.[1] ?? 0;
		this.paused = false;
		this.dispatchEvent(new Event('play'));
		this.dispatchEvent(new Event('timeupdate'));
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

const Reporter: React.FC<{ element: FakeVideoElement; report: (ranges: PlayedRange[], position: number, replay: ReplayReport) => Promise<boolean>; watchedThroughSeconds?: number }> = ({
	element,
	report,
	watchedThroughSeconds,
}) => {
	useWatchProgressReporter(element as unknown as HTMLVideoElement, report, watchedThroughSeconds);
	return <span>Reporting</span>;
};

/** Renders the reporter until "Leave the page" is clicked, which unmounts it. */
const WatchProgressHarness: React.FC<{ element: FakeVideoElement; report: (ranges: PlayedRange[], position: number, replay: ReplayReport) => Promise<boolean>; watchedThroughSeconds?: number }> = ({
	element,
	report,
	watchedThroughSeconds,
}) => {
	const [mounted, setMounted] = useState(true);
	return (
		<div>
			{mounted ? (
				<Reporter
					element={element}
					report={report}
					watchedThroughSeconds={watchedThroughSeconds}
				/>
			) : null}
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

export const SendsAgainAfterAFailedReport: Story = {
	args: { element: new FakeVideoElement(), report: fn(async () => false) },
	play: async ({ args }) => {
		args.element.play([[0, 30]]);
		args.element.pause();
		await waitFor(() => expect(args.report).toHaveBeenCalledTimes(1));
		args.element.end();
		await waitFor(() => expect(args.report).toHaveBeenCalledTimes(2));
		await expect(args.report).toHaveBeenLastCalledWith([{ start: 0, end: 30 }], 30, anySession);
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

/** Rewinding and playing again counts the buckets played below the furthest point reached. */
export const CountsBucketsPlayedAgainAfterRewinding: Story = {
	args: { element: new FakeVideoElement(), report: fn(async () => true) },
	play: async ({ args }) => {
		args.element.play([[0, 60]]);
		args.element.seekTo(10);
		args.element.advanceTo(10, 12, 16, 18);
		args.element.pause();
		await waitFor(() => expect(args.report).toHaveBeenLastCalledWith(expect.anything(), 18, { sessionId: expect.any(String), counts: [0, 0, 1, 1] }));
	},
};

/** Playing forward for the first time is not a replay, however many times the playhead moves. */
export const CountsNoReplaysOnAFirstWatch: Story = {
	args: { element: new FakeVideoElement(), report: fn(async () => true) },
	play: async ({ args }) => {
		args.element.play([[0, 5]]);
		args.element.advanceTo(10, 15, 20, 25, 30);
		args.element.pause();
		await waitFor(() => expect(args.report).toHaveBeenLastCalledWith(expect.anything(), 30, anySession));
	},
};

/** After a reload, resuming where the member stopped and playing on is not a replay. */
export const CountsNoReplaysWhenResumingAfterAReload: Story = {
	args: { element: new FakeVideoElement(), report: fn(async () => true), watchedThroughSeconds: 300 },
	play: async ({ args }) => {
		args.element.play([[300, 302]]);
		args.element.advanceTo(306, 310);
		args.element.pause();
		await waitFor(() => expect(args.report).toHaveBeenLastCalledWith(expect.anything(), 310, anySession));
	},
};

/** After a reload, going back to a part watched in an earlier sitting is a replay. */
export const CountsReplaysBelowWhatAnEarlierSittingWatched: Story = {
	args: { element: new FakeVideoElement(), report: fn(async () => true), watchedThroughSeconds: 300 },
	play: async ({ args }) => {
		args.element.play([[0, 2]]);
		args.element.advanceTo(6);
		args.element.pause();
		await waitFor(() => expect(args.report).toHaveBeenLastCalledWith(expect.anything(), 6, { sessionId: expect.any(String), counts: [1, 1] }));
	},
};
