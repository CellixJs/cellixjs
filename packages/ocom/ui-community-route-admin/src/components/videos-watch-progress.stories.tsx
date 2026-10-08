import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import type { AdminVideosDetailContainerViewingFieldsFragment } from '../generated.tsx';
import { VideosWatchProgress } from './videos-watch-progress.tsx';

const skippedAhead: AdminVideosDetailContainerViewingFieldsFragment = {
	__typename: 'VideoViewing',
	id: '6ac40e30cbfbc8b59ab74e90',
	durationSeconds: 600,
	coverage: 14 / 120,
	completedAt: null,
	updatedAt: '2026-10-07T12:01:15.000Z',
	unwatched: [{ __typename: 'VideoTimeRange', start: 60, end: 590 }],
};

const meta: Meta<typeof VideosWatchProgress> = {
	title: 'Admin/Components/VideosWatchProgress',
	component: VideosWatchProgress,
	tags: ['autodocs'],
	args: { onSeek: fn() },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const NotStarted: Story = {
	args: { viewing: null },
	play: async ({ canvasElement }) => {
		await expect(within(canvasElement).getByText(/You haven't started watching/)).toBeInTheDocument();
	},
};

export const SkippedAhead: Story = {
	args: { viewing: skippedAhead },
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByText('In progress')).toBeInTheDocument();
		await expect(canvas.getByText('11% watched')).toBeInTheDocument();
		await expect(canvas.getByRole('img', { name: 'Watched 11% of the video, with 1 unwatched part' })).toBeInTheDocument();
		await userEvent.click(canvas.getByRole('button', { name: '1:00 – 9:50' }));
		await expect(args.onSeek).toHaveBeenCalledWith(60);
	},
};

export const SeekLimited: Story = {
	args: { viewing: skippedAhead, seekLimited: true, onContinue: fn() },
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);
		await expect(canvas.queryByText('Not watched yet:')).toBeNull();
		await expect(canvas.getByText("You can skip ahead once you've watched the whole video.")).toBeInTheDocument();
		await userEvent.click(canvas.getByRole('button', { name: 'Continue watching' }));
		await expect(args.onContinue).toHaveBeenCalled();
	},
};

export const Completed: Story = {
	args: { viewing: { ...skippedAhead, coverage: 118 / 120, completedAt: '2026-10-07T12:10:00.000Z', unwatched: [{ __typename: 'VideoTimeRange', start: 590, end: 600 }] } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByText(/^Watched /)).toBeInTheDocument();
		await expect(canvas.getByText('98% watched')).toBeInTheDocument();
		await expect(canvas.queryByText('Not watched yet:')).toBeNull();
	},
};

export const AlmostEverything: Story = {
	args: { viewing: { ...skippedAhead, coverage: 0.999, unwatched: [{ __typename: 'VideoTimeRange', start: 595, end: 600 }] } },
	play: async ({ canvasElement }) => {
		// Never rounds up to 100% while a part is still unwatched.
		await expect(within(canvasElement).getByText('99% watched')).toBeInTheDocument();
	},
};
