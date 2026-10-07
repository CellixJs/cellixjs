import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { VideosViewers } from './videos-viewers.tsx';

const viewing = {
	__typename: 'VideoViewing' as const,
	durationSeconds: 600,
	updatedAt: '2026-10-07T12:10:00.000Z',
	unwatched: [],
};

const meta: Meta<typeof VideosViewers> = {
	title: 'Admin/Components/VideosViewers',
	component: VideosViewers,
	tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const NoViewers: Story = {
	args: { viewings: [] },
	play: async ({ canvasElement }) => {
		await expect(within(canvasElement).getByText('No one has started watching this video yet.')).toBeInTheDocument();
	},
};

export const WithViewers: Story = {
	args: {
		viewings: [
			{ ...viewing, id: 'v1', memberId: 'm1', member: { memberName: 'Pat Lee' }, coverage: 1, completedAt: '2026-10-07T12:10:00.000Z' },
			{ ...viewing, id: 'v2', memberId: 'm2', member: { memberName: 'Sam Ortiz' }, coverage: 14 / 120, completedAt: null, unwatched: [{ __typename: 'VideoTimeRange', start: 60, end: 590 }] },
			{ ...viewing, id: 'v3', memberId: 'm3', member: null, coverage: 0.5, completedAt: null },
		],
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const rows = canvas.getAllByRole('row').slice(1);
		await expect(within(rows[0] as HTMLElement).getByText('Pat Lee')).toBeInTheDocument();
		await expect(within(rows[0] as HTMLElement).getByText('Completed')).toBeInTheDocument();
		await expect(within(rows[1] as HTMLElement).getByText('Sam Ortiz')).toBeInTheDocument();
		await expect(within(rows[1] as HTMLElement).getByText('11%')).toBeInTheDocument();
		await expect(within(rows[1] as HTMLElement).getByText('In progress')).toBeInTheDocument();
		await expect(within(rows[2] as HTMLElement).getByText('Unknown member')).toBeInTheDocument();
	},
};
