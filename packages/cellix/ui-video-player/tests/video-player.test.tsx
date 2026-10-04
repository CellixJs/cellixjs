import { VideoPlayer, VideoPlayerError, type VideoPlayerHandle } from '@cellix/ui-video-player';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

type RequestFilter = (type: number, request: { uris: string[] }) => void;

interface FakeTextTrack {
	id: number;
	language: string;
	kind: string | null;
	label: string | null;
}

const shaka = vi.hoisted(() => {
	const state = {
		browserSupported: true,
		loadImplementation: undefined as ((src: string) => Promise<void>) | undefined,
		manifestTextTracks: [] as FakeTextTrack[],
		addTextTrackImplementation: undefined as ((uri: string) => Promise<void>) | undefined,
		players: [] as FakePlayer[],
		overlays: [] as FakeOverlay[],
		installAll: vi.fn(),
	};

	class FakePlayer {
		static isBrowserSupported = () => state.browserSupported;
		readonly requestFilters: RequestFilter[] = [];
		readonly listeners = new Map<string, (event: unknown) => void>();
		readonly attach = vi.fn((_video: HTMLMediaElement) => Promise.resolve());
		readonly load = vi.fn(async (src: string) => {
			await state.loadImplementation?.(src);
		});
		readonly destroy = vi.fn(() => Promise.resolve());
		readonly getNetworkingEngine = () => ({
			registerRequestFilter: (filter: RequestFilter) => {
				this.requestFilters.push(filter);
			},
		});
		readonly addEventListener = (type: string, listener: (event: unknown) => void) => {
			this.listeners.set(type, listener);
		};
		readonly textTracks: FakeTextTrack[] = state.manifestTextTracks.map((track) => ({ ...track }));
		readonly addTextTrackAsync = vi.fn(async (uri: string, language: string, kind: string, _mimeType?: string, _codec?: string, label?: string) => {
			await state.addTextTrackImplementation?.(uri);
			const track = { id: 100 + this.textTracks.length, language, kind, label: label ?? null };
			this.textTracks.push(track);
			return track;
		});
		readonly getTextTracks = () => this.textTracks;
		readonly selectTextTrack = vi.fn((_track?: FakeTextTrack | null) => undefined);

		constructor() {
			state.players.push(this);
		}
	}

	class FakeOverlay {
		readonly player: FakePlayer;
		readonly container: HTMLElement;
		readonly video: HTMLMediaElement;
		readonly destroy = vi.fn(() => Promise.resolve());

		constructor(player: FakePlayer, container: HTMLElement, video: HTMLMediaElement) {
			this.player = player;
			this.container = container;
			this.video = video;
			state.overlays.push(this);
		}
	}

	return { state, FakePlayer, FakeOverlay };
});

vi.mock('shaka-player/dist/shaka-player.ui.js', () => ({
	default: {
		Player: shaka.FakePlayer,
		polyfill: { installAll: shaka.state.installAll },
		ui: { Overlay: shaka.FakeOverlay },
	},
}));

vi.mock('shaka-player/dist/controls.css', () => ({}));

function shakaError(category: number, code: number, severity = 2) {
	return Object.assign(new Error(`Shaka Error ${code}`), { category, code, severity });
}

function onlyPlayer() {
	expect(shaka.state.players).toHaveLength(1);
	const [player] = shaka.state.players;
	if (!player) throw new Error('expected a player');
	return player;
}

const SRC = 'https://storage.example.net/videos/placeholder/manifest.mpd';

// jsdom never loads media, so readyState is stubbed; 1 = HAVE_METADATA.
let readyState = 1;
const readyStateDescriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'readyState');
beforeAll(() => {
	Object.defineProperty(HTMLMediaElement.prototype, 'readyState', { configurable: true, get: () => readyState });
});
afterAll(() => {
	if (readyStateDescriptor) Object.defineProperty(HTMLMediaElement.prototype, 'readyState', readyStateDescriptor);
});

describe('VideoPlayer', () => {
	beforeEach(() => {
		shaka.state.browserSupported = true;
		shaka.state.loadImplementation = undefined;
		shaka.state.manifestTextTracks = [];
		shaka.state.addTextTrackImplementation = undefined;
		readyState = 1;
		shaka.state.players.length = 0;
		shaka.state.overlays.length = 0;
		shaka.state.installAll.mockClear();
	});

	afterEach(() => {
		cleanup();
	});

	describe('loading', () => {
		it('attaches a player to the rendered video element, loads the source, and reports a playback handle', async () => {
			const onReady = vi.fn<(handle: VideoPlayerHandle) => void>();
			render(
				<VideoPlayer
					src={SRC}
					title="Placeholder video"
					onReady={onReady}
				/>,
			);

			await waitFor(() => expect(onReady).toHaveBeenCalledTimes(1));
			const player = onlyPlayer();
			const video = screen.getByTitle('Placeholder video');
			expect(video.tagName).toBe('VIDEO');
			expect(player.attach).toHaveBeenCalledWith(video);
			expect(player.load).toHaveBeenCalledWith(SRC);

			const handle = onReady.mock.calls[0]?.[0];
			const videoElement = video as HTMLVideoElement;
			const play = vi.spyOn(videoElement, 'play').mockResolvedValue();
			const pause = vi.spyOn(videoElement, 'pause').mockImplementation(() => undefined);
			await handle?.play();
			handle?.pause();
			handle?.seek(4);
			expect(play).toHaveBeenCalled();
			expect(pause).toHaveBeenCalled();
			expect(videoElement.currentTime).toBe(4);
			expect(handle?.element).toBe(videoElement);
		});

		it('waits for video metadata before reporting ready, so an immediate seek is not overridden', async () => {
			readyState = 0;
			const onReady = vi.fn();
			render(
				<VideoPlayer
					src={SRC}
					title="Metadata"
					onReady={onReady}
				/>,
			);
			await waitFor(() => expect(onlyPlayer().load).toHaveBeenCalled());
			await new Promise((resolve) => setTimeout(resolve, 0));
			expect(onReady).not.toHaveBeenCalled();

			readyState = 1;
			screen.getByTitle('Metadata').dispatchEvent(new Event('loadedmetadata'));

			await waitFor(() => expect(onReady).toHaveBeenCalledTimes(1));
		});

		it('forwards poster, autoPlay, muted, and loop to the video element', () => {
			render(
				<VideoPlayer
					src={SRC}
					title="Attributes"
					poster="https://storage.example.net/poster.jpg"
					autoPlay
					muted
					loop
				/>,
			);

			const video = screen.getByTitle('Attributes') as HTMLVideoElement;
			expect(video.poster).toBe('https://storage.example.net/poster.jpg');
			expect(video.autoplay).toBe(true);
			expect(video.muted).toBe(true);
			expect(video.loop).toBe(true);
		});
	});

	describe('controls', () => {
		it('mounts the Shaka UI overlay by default', async () => {
			render(
				<VideoPlayer
					src={SRC}
					title="With controls"
				/>,
			);

			await waitFor(() => expect(shaka.state.overlays).toHaveLength(1));
			const overlay = shaka.state.overlays[0];
			expect(overlay?.player).toBe(onlyPlayer());
			expect(overlay?.video).toBe(screen.getByTitle('With controls'));
			expect(overlay?.container.contains(overlay.video)).toBe(true);
		});

		it('renders a bare video element when controls is false', async () => {
			const onReady = vi.fn();
			render(
				<VideoPlayer
					src={SRC}
					controls={false}
					onReady={onReady}
				/>,
			);

			await waitFor(() => expect(onReady).toHaveBeenCalled());
			expect(shaka.state.overlays).toHaveLength(0);
		});
	});

	describe('sasToken', () => {
		async function renderWithToken(sasToken: string | undefined) {
			const onReady = vi.fn();
			render(
				<VideoPlayer
					src={SRC}
					sasToken={sasToken}
					onReady={onReady}
				/>,
			);
			await waitFor(() => expect(onReady).toHaveBeenCalled());
			return onlyPlayer();
		}

		it('appends the token to every request sent to the source origin', async () => {
			const player = await renderWithToken('?sv=2024-11-04&sr=c&sp=r&sig=a%2Bb%3D');
			expect(player.requestFilters).toHaveLength(1);

			const request = {
				uris: ['https://storage.example.net/videos/placeholder/video/1.webm', 'https://storage.example.net/videos/placeholder/audio/init.webm?existing=1'],
			};
			player.requestFilters[0]?.(1, request);

			const [first, second] = request.uris.map((uri) => new URL(uri));
			expect(first?.searchParams.get('sig')).toBe('a+b=');
			expect(first?.searchParams.get('sp')).toBe('r');
			expect(second?.searchParams.get('existing')).toBe('1');
			expect(second?.searchParams.get('sv')).toBe('2024-11-04');
		});

		it('does not send the token to other origins or overwrite an existing signature', async () => {
			const player = await renderWithToken('sv=2024-11-04&sig=secret');
			const crossOrigin = 'https://cdn.example.com/segment.webm';
			const alreadySigned = 'https://storage.example.net/videos/other.webm?sig=other';
			const request = { uris: [crossOrigin, alreadySigned] };

			player.requestFilters[0]?.(1, request);

			expect(request.uris).toEqual([crossOrigin, alreadySigned]);
		});

		it('registers no request filter when no token is provided', async () => {
			const player = await renderWithToken(undefined);
			expect(player.requestFilters).toHaveLength(0);
		});
	});

	describe('textTracks', () => {
		it('adds each caption file after the source loads and before reporting ready', async () => {
			const onReady = vi.fn();
			render(
				<VideoPlayer
					src={SRC}
					textTracks={[
						{ src: 'https://storage.example.net/videos/placeholder/es.vtt', language: 'es', label: 'Español' },
						{ src: 'https://storage.example.net/videos/placeholder/fr.srt', language: 'fr', kind: 'subtitles', mimeType: 'text/srt' },
					]}
					onReady={onReady}
				/>,
			);

			await waitFor(() => expect(onReady).toHaveBeenCalled());
			const player = onlyPlayer();
			expect(player.addTextTrackAsync).toHaveBeenCalledWith('https://storage.example.net/videos/placeholder/es.vtt', 'es', 'caption', undefined, undefined, 'Español');
			expect(player.addTextTrackAsync).toHaveBeenCalledWith('https://storage.example.net/videos/placeholder/fr.srt', 'fr', 'subtitle', 'text/srt', undefined, undefined);
			expect(player.load.mock.invocationCallOrder[0]).toBeLessThan(player.addTextTrackAsync.mock.invocationCallOrder[0] ?? 0);
		});

		it('keeps playing and reports a non-fatal captions error when a caption file fails', async () => {
			shaka.state.addTextTrackImplementation = (uri) => (uri.endsWith('missing.vtt') ? Promise.reject(shakaError(1, 1001)) : Promise.resolve());
			const onError = vi.fn<(error: VideoPlayerError) => void>();
			const onReady = vi.fn();
			render(
				<VideoPlayer
					src={SRC}
					textTracks={[
						{ src: 'https://storage.example.net/missing.vtt', language: 'es' },
						{ src: 'https://storage.example.net/fr.vtt', language: 'fr' },
					]}
					onError={onError}
					onReady={onReady}
				/>,
			);

			await waitFor(() => expect(onReady).toHaveBeenCalled());
			expect(onError).toHaveBeenCalledTimes(1);
			expect(onError.mock.calls[0]?.[0].category).toBe('captions');
			expect(onError.mock.calls[0]?.[0].fatal).toBe(false);
			expect(onError.mock.calls[0]?.[0].code).toBe(1001);
			expect(onlyPlayer().textTracks.map((track) => track.language)).toEqual(['fr']);
			expect(screen.queryByRole('alert')).toBeNull();
		});
	});

	describe('captions', () => {
		async function renderWithCaptions(captions: { enabled: boolean; language?: string } | undefined) {
			const onReady = vi.fn();
			const view = render(
				<VideoPlayer
					src={SRC}
					captions={captions}
					onReady={onReady}
				/>,
			);
			await waitFor(() => expect(onReady).toHaveBeenCalled());
			return { player: onlyPlayer(), ...view };
		}

		beforeEach(() => {
			shaka.state.manifestTextTracks = [
				{ id: 1, language: 'es', kind: 'caption', label: 'Español' },
				{ id: 2, language: 'en-US', kind: 'caption', label: 'English' },
			];
		});

		it('leaves caption selection to the viewer when not configured', async () => {
			const { player } = await renderWithCaptions(undefined);
			expect(player.selectTextTrack).not.toHaveBeenCalled();
		});

		it('turns on the track matching the preferred language, including regional variants', async () => {
			const { player } = await renderWithCaptions({ enabled: true, language: 'en' });
			expect(player.selectTextTrack).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }));
		});

		it('turns on the first track when no language is given', async () => {
			const { player } = await renderWithCaptions({ enabled: true });
			expect(player.selectTextTrack).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
		});

		it('shows nothing when no track matches the preferred language', async () => {
			const { player } = await renderWithCaptions({ enabled: true, language: 'de' });
			expect(player.selectTextTrack).not.toHaveBeenCalled();
		});

		it('turns captions off when disabled', async () => {
			const { player } = await renderWithCaptions({ enabled: false });
			expect(player.selectTextTrack).toHaveBeenCalledWith(null);
		});

		it('applies caption changes to the loaded video without reloading it', async () => {
			const { player, rerender } = await renderWithCaptions({ enabled: false });

			rerender(
				<VideoPlayer
					src={SRC}
					captions={{ enabled: true, language: 'es' }}
				/>,
			);

			await waitFor(() => expect(player.selectTextTrack).toHaveBeenLastCalledWith(expect.objectContaining({ id: 1 })));
			expect(shaka.state.players).toHaveLength(1);
			expect(player.load).toHaveBeenCalledTimes(1);
		});

		it('can select a caption file added through textTracks', async () => {
			const onReady = vi.fn();
			render(
				<VideoPlayer
					src={SRC}
					textTracks={[{ src: 'https://storage.example.net/fr.vtt', language: 'fr' }]}
					captions={{ enabled: true, language: 'fr' }}
					onReady={onReady}
				/>,
			);

			await waitFor(() => expect(onReady).toHaveBeenCalled());
			expect(onlyPlayer().selectTextTrack).toHaveBeenCalledWith(expect.objectContaining({ language: 'fr' }));
		});
	});

	describe('errors', () => {
		it('reports an unsupported browser without creating a player', async () => {
			shaka.state.browserSupported = false;
			const onError = vi.fn<(error: VideoPlayerError) => void>();
			render(
				<VideoPlayer
					src={SRC}
					onError={onError}
				/>,
			);

			expect((await screen.findByRole('alert')).textContent).toBe('This browser cannot play this video.');
			expect(onError).toHaveBeenCalledTimes(1);
			expect(onError.mock.calls[0]?.[0]).toBeInstanceOf(VideoPlayerError);
			expect(onError.mock.calls[0]?.[0].category).toBe('unsupported-browser');
			expect(shaka.state.players).toHaveLength(0);
		});

		it.each([
			[1, 1001, 'network'],
			[4, 4001, 'manifest'],
			[3, 3016, 'media'],
			[5, 5006, 'media'],
			[6, 6001, 'drm'],
			[2, 2000, 'captions'],
			[7, 7001, 'unknown'],
		] as const)('maps a load failure in Shaka category %i to "%s"', async (category, code, expected) => {
			shaka.state.loadImplementation = () => Promise.reject(shakaError(category, code));
			const onError = vi.fn<(error: VideoPlayerError) => void>();
			render(
				<VideoPlayer
					src={SRC}
					onError={onError}
				/>,
			);

			expect((await screen.findByRole('alert')).textContent).toBe('The video could not be played.');
			const error = onError.mock.calls[0]?.[0];
			expect(error?.category).toBe(expected);
			expect(error?.code).toBe(code);
			expect(error?.fatal).toBe(true);
		});

		it('reports errors raised by the player during playback', async () => {
			const onError = vi.fn<(error: VideoPlayerError) => void>();
			const onReady = vi.fn();
			render(
				<VideoPlayer
					src={SRC}
					onError={onError}
					onReady={onReady}
				/>,
			);
			await waitFor(() => expect(onReady).toHaveBeenCalled());

			onlyPlayer().listeners.get('error')?.({ detail: shakaError(1, 1002) });

			await screen.findByRole('alert');
			expect(onError.mock.calls[0]?.[0].category).toBe('network');
			expect(onError.mock.calls[0]?.[0].fatal).toBe(true);
		});

		it('reports recoverable playback errors without showing the alert', async () => {
			const onError = vi.fn<(error: VideoPlayerError) => void>();
			const onReady = vi.fn();
			render(
				<VideoPlayer
					src={SRC}
					onError={onError}
					onReady={onReady}
				/>,
			);
			await waitFor(() => expect(onReady).toHaveBeenCalled());

			onlyPlayer().listeners.get('error')?.({ detail: shakaError(1, 1001, 1) });

			await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
			expect(onError.mock.calls[0]?.[0].fatal).toBe(false);
			expect(screen.queryByRole('alert')).toBeNull();
		});

		it('wraps non-Shaka failures as unknown errors', async () => {
			shaka.state.loadImplementation = () => Promise.reject(new Error('boom'));
			const onError = vi.fn<(error: VideoPlayerError) => void>();
			render(
				<VideoPlayer
					src={SRC}
					onError={onError}
				/>,
			);

			await screen.findByRole('alert');
			expect(onError.mock.calls[0]?.[0].category).toBe('unknown');
			expect(onError.mock.calls[0]?.[0].code).toBeUndefined();
		});
	});

	describe('lifecycle', () => {
		it('destroys the player when unmounted', async () => {
			const onReady = vi.fn();
			const { unmount } = render(
				<VideoPlayer
					src={SRC}
					controls={false}
					onReady={onReady}
				/>,
			);
			await waitFor(() => expect(onReady).toHaveBeenCalled());

			unmount();

			expect(onlyPlayer().destroy).toHaveBeenCalled();
		});

		it('destroys the overlay, which owns the player, when controls are shown', async () => {
			const { unmount } = render(<VideoPlayer src={SRC} />);
			await waitFor(() => expect(shaka.state.overlays).toHaveLength(1));

			unmount();

			expect(shaka.state.overlays[0]?.destroy).toHaveBeenCalled();
		});

		it('replaces the player when the source changes', async () => {
			const onReady = vi.fn();
			const { rerender } = render(
				<VideoPlayer
					src={SRC}
					controls={false}
					onReady={onReady}
				/>,
			);
			await waitFor(() => expect(onReady).toHaveBeenCalledTimes(1));

			const next = 'https://storage.example.net/videos/next/manifest.mpd';
			rerender(
				<VideoPlayer
					src={next}
					controls={false}
					onReady={onReady}
				/>,
			);
			await waitFor(() => expect(onReady).toHaveBeenCalledTimes(2));

			const [first, second] = shaka.state.players;
			expect(first?.destroy).toHaveBeenCalled();
			expect(second?.load).toHaveBeenCalledWith(next);
		});

		it('ignores a load that is interrupted by unmounting', async () => {
			let rejectLoad: (reason: unknown) => void = () => undefined;
			shaka.state.loadImplementation = () =>
				new Promise((_resolve, reject) => {
					rejectLoad = reject;
				});
			const onError = vi.fn();
			const onReady = vi.fn();
			const { unmount } = render(
				<VideoPlayer
					src={SRC}
					onError={onError}
					onReady={onReady}
				/>,
			);
			await waitFor(() => expect(shaka.state.players).toHaveLength(1));
			await waitFor(() => expect(onlyPlayer().load).toHaveBeenCalled());

			unmount();
			rejectLoad(shakaError(7, 7000));
			await new Promise((resolve) => setTimeout(resolve, 0));

			expect(onError).not.toHaveBeenCalled();
			expect(onReady).not.toHaveBeenCalled();
		});
	});
});

describe('VideoPlayerError', () => {
	it('exposes a stable category, the Shaka code, and the original cause', () => {
		const cause = new Error('underlying');
		const error = new VideoPlayerError('network', 'Request failed.', { code: 1001, cause });

		expect(error).toBeInstanceOf(Error);
		expect(error.name).toBe('VideoPlayerError');
		expect(error.message).toBe('Request failed.');
		expect(error.category).toBe('network');
		expect(error.code).toBe(1001);
		expect(error.cause).toBe(cause);
		expect(error.fatal).toBe(true);
	});

	it('can be marked as non-fatal', () => {
		expect(new VideoPlayerError('captions', 'Caption file failed.', { fatal: false }).fatal).toBe(false);
	});

	it('leaves code undefined when the failure did not come from Shaka', () => {
		expect(new VideoPlayerError('unsupported-browser', 'Unsupported.').code).toBeUndefined();
	});
});
