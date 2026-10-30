import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { VideoPlayer } from './video-player.tsx';

// Served from ../../../assets by Storybook's staticDirs; see .storybook/main.ts.
const PLACEHOLDER_MANIFEST = '/assets/placeholder/manifest.mpd';
const PLACEHOLDER_POSTER = '/assets/placeholder/poster.jpg';
const SPANISH_CAPTIONS = '/assets/placeholder/sidecar/es.vtt';

// Shaka's UI renders cues into this element rather than native <track> cues.
function captionText(canvasElement: HTMLElement): string {
	return canvasElement.querySelector('.shaka-text-container')?.textContent ?? '';
}

const meta = {
	title: 'UI/VideoPlayer',
	component: VideoPlayer,
	args: {
		src: PLACEHOLDER_MANIFEST,
		poster: PLACEHOLDER_POSTER,
		title: 'Big Buck Bunny placeholder',
		muted: true,
		onReady: fn(),
		onError: fn(),
	},
	parameters: { layout: 'padded' },
	decorators: [
		(Story) => (
			<div style={{ maxWidth: 640 }}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof VideoPlayer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Plays the committed DASH placeholder with the Shaka control bar. */
export const Default: Story = {
	play: async ({ args, canvasElement }) => {
		await waitFor(() => expect(args.onReady).toHaveBeenCalledTimes(1), { timeout: 15000 });
		const video = within(canvasElement).getByTitle('Big Buck Bunny placeholder') as HTMLVideoElement;
		expect(video.duration).toBeGreaterThan(9);
		expect(canvasElement.querySelector('.shaka-controls-container')).not.toBeNull();
		expect(args.onError).not.toHaveBeenCalled();
	},
};

/** Bare video element driven through the handle passed to `onReady`. */
export const WithoutControls: Story = {
	args: { controls: false },
	play: async ({ args, canvasElement }) => {
		await waitFor(() => expect(args.onReady).toHaveBeenCalledTimes(1), { timeout: 15000 });
		const handle = (args.onReady as ReturnType<typeof fn>).mock.calls[0]?.[0];
		handle.seek(5);
		expect(handle.element.currentTime).toBe(5);
		expect(canvasElement.querySelector('.shaka-controls-container')).toBeNull();
	},
};

/** English captions from the DASH manifest, turned on at start. */
export const Captions: Story = {
	args: { captions: { enabled: true, language: 'en' } },
	play: async ({ args, canvasElement }) => {
		await waitFor(() => expect(args.onReady).toHaveBeenCalledTimes(1), { timeout: 15000 });
		await waitFor(() => expect(captionText(canvasElement)).toContain('BIG BUCK BUNNY'), { timeout: 5000 });
	},
};

/** A separate Spanish `.vtt` file added with `textTracks` and selected by language. */
export const SidecarCaptions: Story = {
	args: {
		textTracks: [{ src: SPANISH_CAPTIONS, language: 'es', label: 'Español' }],
		captions: { enabled: true, language: 'es' },
	},
	play: async ({ args, canvasElement }) => {
		await waitFor(() => expect(args.onReady).toHaveBeenCalledTimes(1), { timeout: 15000 });
		const handle = (args.onReady as ReturnType<typeof fn>).mock.calls[0]?.[0];
		handle.seek(5.6);
		await waitFor(() => expect(captionText(canvasElement)).toContain('( graznido de cuervo )'), { timeout: 5000 });
		expect(args.onError).not.toHaveBeenCalled();
	},
};

/** Seeking is limited to 3 seconds in, and the limit moves forward as the video plays. */
export const SeekLimit: Story = {
	args: { seekLimit: { allowedUntil: 3 }, onSeekBlocked: fn() },
	play: async ({ args }) => {
		await waitFor(() => expect(args.onReady).toHaveBeenCalledTimes(1), { timeout: 15000 });
		const handle = (args.onReady as ReturnType<typeof fn>).mock.calls[0]?.[0];
		handle.seek(8);
		await waitFor(() => expect(handle.element.currentTime).toBe(3));
		expect(args.onSeekBlocked).toHaveBeenCalledWith({ attempted: 8, allowedUntil: 3 });

		await handle.play();
		await waitFor(() => expect(handle.allowedUntil).toBeGreaterThan(4), { timeout: 5000 });
		handle.pause();
		handle.seek(1);
		await waitFor(() => expect(handle.element.currentTime).toBe(1));
	},
};

/** By default, shortcuts pressed while focus is outside the player are ignored. */
export const KeyboardInPlayer: Story = {
	play: async ({ args }) => {
		await waitFor(() => expect(args.onReady).toHaveBeenCalledTimes(1), { timeout: 15000 });
		const handle = (args.onReady as ReturnType<typeof fn>).mock.calls[0]?.[0];
		(document.activeElement as HTMLElement | null)?.blur();
		await userEvent.keyboard('{ArrowRight}');
		await new Promise((resolve) => setTimeout(resolve, 300));
		expect(handle.element.currentTime).toBe(0);
	},
};

/** With `keyboardScope="page"`, shortcuts work while focus is anywhere on the page. */
export const KeyboardOnPage: Story = {
	args: { keyboardScope: 'page' },
	play: async ({ args }) => {
		await waitFor(() => expect(args.onReady).toHaveBeenCalledTimes(1), { timeout: 15000 });
		const handle = (args.onReady as ReturnType<typeof fn>).mock.calls[0]?.[0];
		(document.activeElement as HTMLElement | null)?.blur();
		await userEvent.keyboard('{ArrowRight}');
		await waitFor(() => expect(handle.element.currentTime).toBe(5));
		await userEvent.keyboard('{ArrowLeft}');
		await waitFor(() => expect(handle.element.currentTime).toBe(0));
	},
};

/** A missing manifest surfaces a network error and an inline alert. */
export const PlaybackError: Story = {
	args: { src: '/assets/missing/manifest.mpd', poster: undefined },
	play: async ({ args, canvasElement }) => {
		const alert = await within(canvasElement).findByRole('alert', {}, { timeout: 15000 });
		expect(alert.textContent).toBe('The video could not be played.');
		expect(args.onError).toHaveBeenCalledWith(expect.objectContaining({ category: 'network', fatal: true }));
		expect(args.onReady).not.toHaveBeenCalled();
	},
};

/**
 * Streams the placeholder from local Azurite using a container-scoped read SAS.
 * Requires Azurite (`pnpm run azurite` in apps/api) and `pnpm run seed:azurite` in this package.
 */
export const LocalAzurite: Story = {
	tags: ['!test'],
	args: {
		src: import.meta.env.STORYBOOK_AZURITE_PLACEHOLDER_URL,
		sasToken: import.meta.env.STORYBOOK_AZURITE_PLACEHOLDER_SAS,
		poster: undefined,
	},
};
