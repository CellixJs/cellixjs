import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { type PlayedRange, useWatchProgressReporter } from './use-watch-progress-reporter.ts';

/** A stand-in for a video element: its played spans and paused state can be set directly. */
class FakeVideoElement extends EventTarget {
	paused = true;
	private spans: [number, number][] = [];

	get played() {
		const spans = this.spans;
		return { length: spans.length, start: (index: number) => spans[index]?.[0] ?? 0, end: (index: number) => spans[index]?.[1] ?? 0 };
	}

	play(spans: [number, number][]) {
		this.spans = spans;
		this.paused = false;
		this.dispatchEvent(new Event('play'));
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

const Reporter: React.FC<{ element: FakeVideoElement; report: (ranges: PlayedRange[]) => Promise<boolean> }> = ({ element, report }) => {
	useWatchProgressReporter(element as unknown as HTMLVideoElement, report);
	return <span>Reporting</span>;
};

/** Renders the reporter until "Leave the page" is clicked, which unmounts it. */
const WatchProgressHarness: React.FC<{ element: FakeVideoElement; report: (ranges: PlayedRange[]) => Promise<boolean> }> = ({ element, report }) => {
	const [mounted, setMounted] = useState(true);
	return (
		<div>
			{mounted ? (
				<Reporter
					element={element}
					report={report}
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
			expect(args.report).toHaveBeenCalledWith([
				{ start: 0, end: 60 },
				{ start: 590, end: 600 },
			]),
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
		await expect(args.report).toHaveBeenLastCalledWith([{ start: 0, end: 30 }]);
	},
};

export const ReportsWhenLeavingThePage: Story = {
	args: { element: new FakeVideoElement(), report: fn(async () => true) },
	play: async ({ args, canvasElement }) => {
		args.element.play([[0, 45]]);
		await userEvent.click(within(canvasElement).getByRole('button', { name: 'Leave the page' }));
		await waitFor(() => expect(args.report).toHaveBeenCalledWith([{ start: 0, end: 45 }]));
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
