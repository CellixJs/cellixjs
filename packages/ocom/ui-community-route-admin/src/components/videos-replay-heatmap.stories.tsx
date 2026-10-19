import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { type ReplayHeatmap, VideosReplayHeatmap } from './videos-replay-heatmap.tsx';

/** A one-minute video: twelve 5-second parts. */
const heatmap = (firstWatch: number[], postCompletion: number[], viewingCount = 4, viewers: number[] = new Array(12).fill(viewingCount)): ReplayHeatmap => ({
	__typename: 'VideoReplayHeatmap',
	bucketSeconds: 5,
	bucketCount: 12,
	viewers,
	firstWatch,
	postCompletion,
	viewingCount,
});

const meta: Meta<typeof VideosReplayHeatmap> = {
	title: 'Admin/Components/VideosReplayHeatmap',
	component: VideosReplayHeatmap,
	tags: ['autodocs'],
	args: { onSeek: fn() },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Members rewound around 20 seconds in, and came back to the end after finishing. */
export const RewindsAndReturnVisits: Story = {
	args: { heatmap: heatmap([0, 1, 0, 6, 2, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 4, 2]) },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByText("Across 4 viewings, as reported by members' players. Darker parts were watched more often.")).toBeVisible();
		await expect(canvas.getAllByTestId('replay-part')).toHaveLength(36);
	},
};

/** Clicking a part moves the player there, so a manager can see what members went back to. */
export const SeeksToAPartThatWasReplayed: Story = {
	args: { heatmap: heatmap([0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0], new Array(12).fill(0)) },
	play: async ({ args, canvasElement }) => {
		await userEvent.click(within(canvasElement).getByLabelText('Rewound before finishing at 0:15: 6'));
		await expect(args.onSeek).toHaveBeenCalledWith(15);
	},
};

/** Parts nobody replayed are not clickable, so the only targets are ones worth looking at. */
export const PartsWithNoReplaysAreNotClickable: Story = {
	args: { heatmap: heatmap([0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0], new Array(12).fill(0)) },
	play: async ({ args, canvasElement }) => {
		await userEvent.click(within(canvasElement).getByLabelText('Rewound before finishing at 0:00: 0'));
		await expect(args.onSeek).not.toHaveBeenCalled();
	},
};

/** A video people have watched straight through still shows how many watched each part, but no replay rows. */
export const NobodyHasReplayedAnything: Story = {
	args: { heatmap: heatmap(new Array(12).fill(0), new Array(12).fill(0), 3) },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByText('Nobody has gone back over a part of this video yet.')).toBeVisible();
		await expect(canvas.getAllByTestId('replay-part')).toHaveLength(12);
	},
};

/** Times watched adds each part's viewers to its replays, so a part two members watched and one rewound reads 3. */
export const TimesWatchedAddsViewersAndReplays: Story = {
	args: { heatmap: heatmap([0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2], 2, [2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1]) },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByLabelText('Times watched at 0:05: 3')).toBeVisible();
		await expect(canvas.getByLabelText('Times watched at 0:40: 1')).toBeVisible();
		await expect(canvas.getByLabelText('Times watched at 0:55: 3')).toBeVisible();
	},
};

/** One viewing reads as "viewing", not "viewings". */
export const ASingleViewing: Story = {
	args: { heatmap: heatmap([0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0], new Array(12).fill(0), 1) },
	play: async ({ canvasElement }) => {
		await expect(within(canvasElement).getByText("Across 1 viewing, as reported by members' players. Darker parts were watched more often.")).toBeVisible();
	},
};
