import type { VideoPlayerHandle } from '@cellix/ui-video-player';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import type { AdminVideosDetailContainerVideoFieldsFragment, AdminVideosDetailContainerViewingFieldsFragment } from '../generated.tsx';
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
	canManage: false,
	captionTracks: [],
};

const meta: Meta<typeof VideosDetail> = {
	title: 'Admin/Components/VideosDetail',
	component: VideosDetail,
	tags: ['autodocs'],
	args: { video: readyVideo, onAddCaptions: fn(), onRemoveCaption: fn() },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {
	args: {
		playback: { hlsManifestUrl: 'https://storage.example/videos-c1/6ac40e30cbfbc8b59ab74e81/master.m3u8', sasToken: 'sv=2021-04-10&sr=c&sp=r', captionTracks: [] },
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

export const WithCaptions: Story = {
	args: {
		video: {
			...readyVideo,
			captionTracks: [
				{ __typename: 'VideoCaptionTrack', language: 'en', label: 'English', kind: 'CAPTIONS' },
				{ __typename: 'VideoCaptionTrack', language: 'es', label: 'Español', kind: 'SUBTITLES' },
			],
		},
	},
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByText('English')).toBeInTheDocument();
		await expect(canvas.getByText('Subtitles')).toBeInTheDocument();

		await userEvent.click(canvas.getByRole('button', { name: /Add Captions/ }));
		await expect(args.onAddCaptions).toHaveBeenCalled();

		await userEvent.click(canvas.getAllByRole('button', { name: 'Remove' })[1] as HTMLElement);
		const body = within(document.body);
		await expect(await body.findByText('Remove the Español captions?')).toBeInTheDocument();
		await userEvent.click(body.getAllByRole('button', { name: 'Remove' }).at(-1) as HTMLElement);
		await expect(args.onRemoveCaption).toHaveBeenCalledWith('es');
	},
};

export const NoCaptions: Story = {
	play: async ({ canvasElement }) => {
		await expect(within(canvasElement).getByText(/No captions yet\./)).toBeInTheDocument();
	},
};

/** A manager is not limited, so they can jump to the parts they skipped. */
export const WithWatchProgress: Story = {
	args: {
		video: { ...readyVideo, canManage: true },
		playback: { hlsManifestUrl: 'https://storage.example/videos-c1/6ac40e30cbfbc8b59ab74e81/master.m3u8', sasToken: 'sv=2021-04-10&sr=c&sp=r', captionTracks: [] },
		viewings: {
			mine: {
				__typename: 'VideoViewing',
				id: 'v1',
				durationSeconds: 95,
				coverage: 0.5,
				lastPositionSeconds: null,
				watchedThroughSeconds: null,
				completedAt: null,
				updatedAt: '2026-10-07T12:00:00.000Z',
				unwatched: [{ __typename: 'VideoTimeRange', start: 50, end: 95 }],
			},
			all: [
				{
					__typename: 'VideoViewing',
					id: 'v1',
					memberId: 'm1',
					member: { memberName: 'Pat Lee' },
					durationSeconds: 95,
					coverage: 0.5,
					lastPositionSeconds: null,
					watchedThroughSeconds: null,
					completedAt: null,
					updatedAt: '2026-10-07T12:00:00.000Z',
					unwatched: [],
				},
			],
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByRole('heading', { name: 'Your Progress' })).toBeInTheDocument();
		await expect(canvas.getByRole('button', { name: '0:50 – 1:35' })).toBeInTheDocument();
		await expect(canvas.getByRole('heading', { name: 'Viewers' })).toBeInTheDocument();
		await expect(canvas.getByText('Pat Lee')).toBeInTheDocument();
	},
};

export const WithoutWatchProgress: Story = {
	args: { playback: { hlsManifestUrl: 'https://storage.example/videos-c1/6ac40e30cbfbc8b59ab74e81/master.m3u8', sasToken: 'sv=2021-04-10&sr=c&sp=r', captionTracks: [] } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.queryByRole('heading', { name: 'Your Progress' })).toBeNull();
		await expect(canvas.queryByRole('heading', { name: 'Viewers' })).toBeNull();
	},
};

// The video player's 10-second development clip, served by .storybook/main.ts.
const playableVideo = { ...readyVideo, durationSeconds: 10 };
const placeholderPlayback = { hlsManifestUrl: '/assets/placeholder/manifest.mpd', sasToken: '', captionTracks: [] };
// Watched to 3.5 seconds, which counts the part up to 4, then went back to 3 and left.
const stoppedAtThree: AdminVideosDetailContainerViewingFieldsFragment = {
	__typename: 'VideoViewing',
	id: 'v1',
	durationSeconds: 10,
	coverage: 0.4,
	lastPositionSeconds: 3,
	watchedThroughSeconds: 3.5,
	completedAt: null,
	updatedAt: '2026-10-07T12:00:00.000Z',
	unwatched: [{ __typename: 'VideoTimeRange', start: 4, end: 10 }],
};
const watched: AdminVideosDetailContainerViewingFieldsFragment = { ...stoppedAtThree, coverage: 1, lastPositionSeconds: 10, watchedThroughSeconds: 10, completedAt: '2026-10-07T12:10:00.000Z', unwatched: [] };

const readyPlayer = async (onPlayerReady: unknown): Promise<VideoPlayerHandle> => {
	const ready = onPlayerReady as ReturnType<typeof fn>;
	await waitFor(() => expect(ready).toHaveBeenCalled(), { timeout: 15000 });
	return ready.mock.calls[0]?.[0] as VideoPlayerHandle;
};

const seekBlockedNotice = "You can't skip past the furthest point you've watched until you've watched the whole video.";

/** A member who stopped part way is asked whether to resume where their player stopped, and cannot skip past the furthest point they watched. */
export const MemberResumes: Story = {
	args: { video: playableVideo, playback: placeholderPlayback, viewings: { mine: stoppedAtThree, all: [] }, onPlayerReady: fn() },
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);
		const player = await readyPlayer(args.onPlayerReady);
		const prompt = await canvas.findByRole('dialog', { name: 'You stopped at 0:03.' });
		await expect(within(prompt).getByRole('button', { name: 'Resume from 0:03' })).toHaveFocus();

		await userEvent.click(within(prompt).getByRole('button', { name: 'Resume from 0:03' }));
		await expect(canvas.queryByRole('dialog')).toBeNull();
		await waitFor(() => expect(player.element.currentTime).toBeGreaterThanOrEqual(3));

		player.pause();
		player.seek(9);
		await waitFor(() => expect(player.element.currentTime).toBeLessThan(4.6));
		await expect(await canvas.findByText(seekBlockedNotice)).toBeInTheDocument();
		await expect(canvas.queryByRole('switch')).toBeNull();
	},
};

/** Escape starts the video over instead of resuming. */
export const MemberStartsOver: Story = {
	args: { video: playableVideo, playback: placeholderPlayback, viewings: { mine: stoppedAtThree, all: [] }, onPlayerReady: fn() },
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);
		const player = await readyPlayer(args.onPlayerReady);
		await canvas.findByRole('dialog', { name: 'You stopped at 0:03.' });

		await userEvent.keyboard('{Escape}');
		await expect(canvas.queryByRole('dialog')).toBeNull();
		await expect(player.element.currentTime).toBeLessThan(1);
	},
};

/** A viewing saved before positions were recorded resumes at the furthest point watched. */
export const MemberResumesAnOlderViewing: Story = {
	args: { video: playableVideo, playback: placeholderPlayback, viewings: { mine: { ...stoppedAtThree, lastPositionSeconds: null, watchedThroughSeconds: null }, all: [] }, onPlayerReady: fn() },
	play: async ({ canvasElement, args }) => {
		await readyPlayer(args.onPlayerReady);
		await expect(await within(canvasElement).findByRole('dialog', { name: 'You stopped at 0:04.' })).toBeInTheDocument();
	},
};

/** A member who has not started is not asked to resume, and cannot skip ahead. */
export const MemberStartsFresh: Story = {
	args: { video: playableVideo, playback: placeholderPlayback, viewings: { mine: null, all: [] }, onPlayerReady: fn() },
	play: async ({ canvasElement, args }) => {
		const player = await readyPlayer(args.onPlayerReady);
		await expect(within(canvasElement).queryByRole('dialog')).toBeNull();
		player.seek(5);
		await waitFor(() => expect(player.element.currentTime).toBe(0));
	},
};

/** A member who watched the whole video and came back part way through is asked whether to resume, and can skip anywhere. */
export const MemberResumesAWatchedVideo: Story = {
	args: { video: playableVideo, playback: placeholderPlayback, viewings: { mine: { ...watched, lastPositionSeconds: 3 }, all: [] }, onPlayerReady: fn() },
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);
		const player = await readyPlayer(args.onPlayerReady);
		const prompt = await canvas.findByRole('dialog', { name: 'You stopped at 0:03.' });
		await userEvent.click(within(prompt).getByRole('button', { name: 'Resume from 0:03' }));
		await waitFor(() => expect(player.element.currentTime).toBeGreaterThanOrEqual(3));

		player.pause();
		player.seek(8);
		await waitFor(() => expect(player.element.currentTime).toBe(8));
	},
};

/** Once a member has watched to the end, they can skip anywhere and start over without being asked. */
export const MemberAlreadyWatched: Story = {
	args: { video: playableVideo, playback: placeholderPlayback, viewings: { mine: watched, all: [] }, onPlayerReady: fn() },
	play: async ({ canvasElement, args }) => {
		const player = await readyPlayer(args.onPlayerReady);
		await expect(within(canvasElement).queryByRole('dialog')).toBeNull();
		player.seek(8);
		await waitFor(() => expect(player.element.currentTime).toBe(8));
	},
};

/** Keyboard shortcuts work from anywhere on the page, without focusing the player first. */
export const MemberUsesKeyboardShortcuts: Story = {
	args: { video: playableVideo, playback: placeholderPlayback, viewings: { mine: watched, all: [] }, onPlayerReady: fn() },
	play: async ({ args }) => {
		const player = await readyPlayer(args.onPlayerReady);
		(document.activeElement as HTMLElement | null)?.blur();
		await userEvent.keyboard('{ArrowRight}');
		await waitFor(() => expect(player.element.currentTime).toBe(5));
	},
};

/** While the resume prompt is open, Space presses its focused button rather than playing the video; shortcuts work once it closes. */
export const MemberResumesWithTheKeyboard: Story = {
	args: { video: playableVideo, playback: placeholderPlayback, viewings: { mine: stoppedAtThree, all: [] }, onPlayerReady: fn() },
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);
		const player = await readyPlayer(args.onPlayerReady);
		const prompt = await canvas.findByRole('dialog', { name: 'You stopped at 0:03.' });
		await expect(within(prompt).getByRole('button', { name: 'Resume from 0:03' })).toHaveFocus();

		await userEvent.keyboard(' ');
		await expect(canvas.queryByRole('dialog')).toBeNull();
		await waitFor(() => expect(player.element.currentTime).toBeGreaterThanOrEqual(3));

		player.pause();
		(document.activeElement as HTMLElement | null)?.blur();
		await userEvent.keyboard('{ArrowLeft}');
		await waitFor(() => expect(player.element.currentTime).toBe(0));
	},
};

/** Managers can skip anywhere, and can turn on the member limit to try it, starting over on a video they have watched. */
export const ManagerTestsAsMember: Story = {
	args: { video: { ...playableVideo, canManage: true }, playback: placeholderPlayback, viewings: { mine: watched, all: [] }, onPlayerReady: fn() },
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);
		const player = await readyPlayer(args.onPlayerReady);
		player.seek(8);
		await waitFor(() => expect(player.element.currentTime).toBe(8));

		await userEvent.click(canvas.getByRole('switch', { name: 'Test as a member' }));
		await waitFor(() => expect(player.element.currentTime).toBe(0));
		player.seek(8);
		await expect(await canvas.findByText(seekBlockedNotice)).toBeInTheDocument();
		await expect(player.element.currentTime).toBe(0);

		await userEvent.click(canvas.getByRole('switch', { name: 'Test as a member' }));
		player.seek(8);
		await waitFor(() => expect(player.element.currentTime).toBe(8));
	},
};
