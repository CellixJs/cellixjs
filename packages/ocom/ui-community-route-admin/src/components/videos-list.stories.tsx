import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import type { AdminVideosListContainerVideoFieldsFragment } from '../generated.tsx';
import { formatDuration, formatSize, VideosList } from './videos-list.tsx';

const video = (overrides: Partial<AdminVideosListContainerVideoFieldsFragment>): AdminVideosListContainerVideoFieldsFragment => ({
	__typename: 'Video',
	id: '6ac40e30cbfbc8b59ab74e81',
	title: 'Annual meeting',
	status: 'READY',
	sourceSizeBytes: 524_288_000,
	durationSeconds: 3725,
	renditionHeights: [1080, 720, 480, 360],
	failureMessage: null,
	createdAt: '2026-10-04T12:00:00.000Z',
	...overrides,
});

const videos = [
	video({}),
	video({ id: '6ac40e30cbfbc8b59ab74e82', title: 'Pool opening', status: 'ENCODING', durationSeconds: null, renditionHeights: [] }),
	video({ id: '6ac40e30cbfbc8b59ab74e83', title: 'Garden tour', status: 'UPLOADED', durationSeconds: null, renditionHeights: [] }),
	video({ id: '6ac40e30cbfbc8b59ab74e84', title: 'Broken clip', status: 'FAILED', durationSeconds: null, renditionHeights: [], failureMessage: 'The file has no video stream.' }),
	video({ id: '6ac40e30cbfbc8b59ab74e85', title: 'Abandoned upload', status: 'AWAITING_UPLOAD', durationSeconds: null, renditionHeights: [] }),
];

const meta: Meta<typeof VideosList> = {
	title: 'Admin/Components/VideosList',
	component: VideosList,
	tags: ['autodocs'],
	args: {
		data: videos,
		onUpload: fn(),
		onWatch: fn(),
		onRefresh: fn(),
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByText('Community Videos (5)')).toBeInTheDocument();
		for (const label of ['Ready', 'Encoding', 'Waiting to be encoded', 'Encoding failed', 'Upload incomplete']) {
			await expect(canvas.getByText(label)).toBeInTheDocument();
		}
		await expect(canvas.getByText('1:02:05')).toBeInTheDocument();
		await expect(canvas.getByText('Up to 1080p')).toBeInTheDocument();
		await expect(canvas.getAllByText('500.0 MB')).toHaveLength(5);

		// Only ready videos can be watched.
		const watch = canvas.getAllByRole('button', { name: 'Watch' });
		await expect(watch).toHaveLength(1);
		await userEvent.click(watch[0] as HTMLElement);
		await expect(args.onWatch).toHaveBeenCalledWith('6ac40e30cbfbc8b59ab74e81');

		await userEvent.click(canvas.getByRole('button', { name: /Upload Video/ }));
		await expect(args.onUpload).toHaveBeenCalled();
		await userEvent.click(canvas.getByRole('button', { name: /Refresh/ }));
		await expect(args.onRefresh).toHaveBeenCalled();
	},
};

export const FailureReason: Story = {
	args: { data: [videos[3] as AdminVideosListContainerVideoFieldsFragment] },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.hover(canvas.getByText('Encoding failed'));
		await expect(await within(document.body).findByText(/The file has no video stream\./)).toBeInTheDocument();
	},
};

export const Empty: Story = {
	args: { data: [] },
	play: async ({ canvasElement }) => {
		await expect(within(canvasElement).getByText('No videos yet. Upload one to get started.')).toBeInTheDocument();
	},
};

export const Formatting: Story = {
	args: { data: [] },
	play: async () => {
		await expect(formatDuration(null)).toBe('—');
		await expect(formatDuration(65.4)).toBe('1:05');
		await expect(formatDuration(3600)).toBe('1:00:00');
		await expect(formatSize(1.5 * 1024 ** 3)).toBe('1.5 GB');
		await expect(formatSize(5 * 1024 ** 2)).toBe('5.0 MB');
	},
};
