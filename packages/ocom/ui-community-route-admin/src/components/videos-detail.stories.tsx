import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import type { AdminVideosDetailContainerVideoFieldsFragment } from '../generated.tsx';
import { VideosDetail } from './videos-detail.tsx';

const readyVideo: AdminVideosDetailContainerVideoFieldsFragment = {
	__typename: 'Video',
	id: '6ac40e30cbfbc8b59ab74e81',
	title: 'Annual meeting',
	status: 'READY',
	durationSeconds: 95,
	renditionHeights: [480, 1080, 720],
	failureMessage: null,
	createdAt: '2026-10-04T12:00:00.000Z',
};

const meta: Meta<typeof VideosDetail> = {
	title: 'Admin/Components/VideosDetail',
	component: VideosDetail,
	tags: ['autodocs'],
	args: { video: readyVideo },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {
	args: {
		playback: { hlsManifestUrl: 'https://storage.example/videos-c1/6ac40e30cbfbc8b59ab74e81/master.m3u8', sasToken: 'sv=2021-04-10&sr=c&sp=r' },
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByRole('heading', { name: 'Annual meeting' })).toBeInTheDocument();
		await expect(canvasElement.querySelector('video[title="Annual meeting"]')).not.toBeNull();
		await expect(canvas.getByText('1:35')).toBeInTheDocument();
		await expect(canvas.getByText('1080p, 720p, 480p')).toBeInTheDocument();
	},
};

export const Encoding: Story = {
	args: { video: { ...readyVideo, status: 'ENCODING', durationSeconds: null, renditionHeights: [] } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getAllByText('Encoding')).toHaveLength(2);
		await expect(canvas.getByText('Staff are preparing it for streaming.')).toBeInTheDocument();
		await expect(canvasElement.querySelector('video')).toBeNull();
	},
};

export const Failed: Story = {
	args: { video: { ...readyVideo, status: 'FAILED', durationSeconds: null, renditionHeights: [], failureMessage: 'The file has no video stream.' } },
	play: async ({ canvasElement }) => {
		await expect(within(canvasElement).getByText('The video could not be prepared for streaming. The file has no video stream.')).toBeInTheDocument();
	},
};

export const PlaybackUnavailable: Story = {
	args: { playbackError: 'The video could not be loaded for playback. Refresh the page to try again.' },
	play: async ({ canvasElement }) => {
		await expect(within(canvasElement).getByText('The video could not be loaded for playback. Refresh the page to try again.')).toBeInTheDocument();
	},
};
