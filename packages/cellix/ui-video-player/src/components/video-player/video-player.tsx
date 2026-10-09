import { type CSSProperties, type FC, useEffect, useRef, useState } from 'react';
import { createSasTokenAppender } from './sas-token.ts';
import { loadShaka, type ShakaOverlay, type ShakaPlayer, type ShakaTextTrack } from './shaka-loader.ts';
import { isLoadInterruption, toVideoPlayerError, VideoPlayerError } from './video-player-error.ts';

/**
 * Imperative playback controls passed to {@link VideoPlayerProps.onReady}.
 *
 * Use it to drive playback from custom UI (for example when `controls` is `false`).
 */
export interface VideoPlayerHandle {
	/** Starts or resumes playback. Rejects when the browser blocks autoplay. */
	play(): Promise<void>;
	/** Pauses playback. */
	pause(): void;
	/** Moves the playhead to the given position, in seconds. A seek past {@link VideoPlayerProps.seekLimit} stops at the limit. */
	seek(seconds: number): void;
	/** The furthest position, in seconds, viewers can currently seek to, or `undefined` when seeking is not limited. */
	readonly allowedUntil: number | undefined;
	/** The underlying `<video>` element, for reading state or attaching listeners. */
	readonly element: HTMLVideoElement;
}

/**
 * A caption or subtitle file loaded alongside the video, for example a `.vtt` file
 * stored next to the manifest in blob storage.
 */
export interface VideoPlayerTextTrack {
	/** Absolute URL of the file. WebVTT (`.vtt`), SRT (`.srt`), and TTML (`.ttml`, `.xml`) are supported. */
	src: string;
	/** BCP 47 language tag, such as `en` or `es-MX`. */
	language: string;
	/**
	 * `captions` describe speech and meaningful sounds for viewers who cannot hear the audio;
	 * `subtitles` translate dialogue only.
	 *
	 * @defaultValue 'captions'
	 */
	kind?: 'captions' | 'subtitles';
	/** Name shown in the captions menu. Defaults to the language name. */
	label?: string;
	/** MIME type, when it cannot be inferred from the file extension (for example `text/vtt`). */
	mimeType?: string;
}

/**
 * Initial caption state for {@link VideoPlayer}.
 */
export interface VideoPlayerCaptions {
	/** Whether captions are shown. */
	enabled: boolean;
	/**
	 * Preferred BCP 47 language. `en` also matches regional tracks such as `en-US`.
	 * When omitted, the first available track is shown. When no track matches, captions stay off.
	 */
	language?: string | undefined;
}

/**
 * Limits how far ahead viewers can seek, for {@link VideoPlayerProps.seekLimit}.
 */
export interface VideoPlayerSeekLimit {
	/**
	 * The furthest position, in seconds, viewers can seek to when the video loads, for example
	 * where they stopped watching last time. The limit then moves forward as the video plays.
	 */
	allowedUntil: number;
}

/**
 * Details of a refused seek, passed to {@link VideoPlayerProps.onSeekBlocked}.
 */
export interface VideoPlayerSeekBlocked {
	/** Where the viewer tried to seek to, in seconds. */
	attempted: number;
	/** Where the playhead was returned to: the furthest position they can seek to, in seconds. */
	allowedUntil: number;
}

/**
 * Props for {@link VideoPlayer}.
 */
export interface VideoPlayerProps {
	/**
	 * URL of the media to play: a DASH (`.mpd`) or HLS (`.m3u8`) manifest, or a progressive file such as `.mp4` or `.webm`.
	 *
	 * @remarks
	 * Changing `src` destroys the current player and loads the new source.
	 */
	src: string;
	/**
	 * Azure Blob Storage SAS token (with or without a leading `?`) appended to every
	 * manifest, segment, and media request sent to the same origin as {@link VideoPlayerProps.src}.
	 *
	 * @remarks
	 * The token is never sent to other origins, and URLs that already contain a `sig`
	 * parameter are left untouched. Use a token scoped to the container or path that holds
	 * the manifest and all of its segments. Changing the token reloads the source.
	 */
	sasToken?: string | undefined;
	/**
	 * Caption or subtitle files to add alongside any tracks already listed in the manifest.
	 *
	 * @remarks
	 * Files are loaded after the source, through the same request pipeline, so `sasToken` also
	 * applies to them when they share the source's origin. A file that fails to load is reported
	 * through `onError` with category `captions` and `fatal: false`; playback continues.
	 * Changing the list reloads the source.
	 */
	textTracks?: VideoPlayerTextTrack[] | undefined;
	/**
	 * Turns captions on or off and picks the preferred language. When omitted, captions
	 * start off and viewers choose them from the Shaka control bar.
	 *
	 * @remarks
	 * Changes are applied to the loaded video without reloading it.
	 */
	captions?: VideoPlayerCaptions | undefined;
	/** Image shown before playback starts. */
	poster?: string;
	/** Accessible name for the video element. */
	title?: string;
	/** Starts playback once loaded. Browsers usually only allow this when `muted` is also set. @defaultValue false */
	autoPlay?: boolean;
	/** Starts muted. @defaultValue false */
	muted?: boolean;
	/** Restarts playback when it reaches the end. @defaultValue false */
	loop?: boolean;
	/**
	 * Whether to show the Shaka Player control bar. When `false`, a bare `<video>` is
	 * rendered and playback is driven through {@link VideoPlayerHandle}.
	 *
	 * @defaultValue true
	 */
	controls?: boolean;
	/**
	 * Where the control bar's keyboard shortcuts are heard when the player is not fullscreen.
	 *
	 * - `'player'`: only while keyboard focus is inside the player, for example on the seek bar.
	 * - `'page'`: anywhere on the page, for pages built around a single video.
	 *
	 * In fullscreen, shortcuts always work, whatever this is set to.
	 *
	 * @remarks
	 * - With `'page'`, the arrow keys, Page Up/Down, Home, and End seek instead of scrolling the
	 *   page, and Space plays or pauses even when a button elsewhere has focus. Keys typed into
	 *   text fields, text areas, selects, and editable content are still ignored, as are keys
	 *   pressed with Ctrl or Cmd. Use it on at most one player per page.
	 * - Changes apply without reloading the video. Has no effect when `controls` is `false`.
	 *
	 * @defaultValue 'player'
	 */
	keyboardScope?: 'player' | 'page';
	/**
	 * Stops viewers seeking past the furthest point they have played, for example until they
	 * have watched a video once. Omit it to allow seeking anywhere.
	 *
	 * @remarks
	 * - The limit starts at `allowedUntil` and moves forward as the video plays at any speed.
	 *   Seeking does not move it, and seeking backwards is always allowed.
	 * - A seek past the limit, from the control bar, keyboard, media keys, or
	 *   {@link VideoPlayerHandle.seek}, returns the playhead to the limit and calls `onSeekBlocked`.
	 * - Changes apply without reloading the video. A higher `allowedUntil` raises the limit; a lower
	 *   one never takes back what the viewer has already played. Changing `src` starts over.
	 * - This runs in the browser, so it guides viewers but cannot stop someone who changes the page.
	 *   Enforce anything that matters on the server.
	 */
	seekLimit?: VideoPlayerSeekLimit | undefined;
	/**
	 * Called when a seek past {@link VideoPlayerProps.seekLimit} is refused. Dragging the seek bar can
	 * call it several times in a row.
	 */
	onSeekBlocked?: (detail: VideoPlayerSeekBlocked) => void;
	/** Class name applied to the outer container. */
	className?: string;
	/** Inline styles applied to the outer container. */
	style?: CSSProperties;
	/**
	 * Called once the source and its metadata have loaded, caption files have been added,
	 * and playback can be controlled (including seeking to a saved position).
	 */
	onReady?: (handle: VideoPlayerHandle) => void;
	/**
	 * Called when the source cannot be loaded, playback fails, or a caption file fails.
	 * For errors with `fatal: true` the component also renders an inline error message.
	 */
	onError?: (error: VideoPlayerError) => void;
}

const UNSUPPORTED_MESSAGE = 'This browser cannot play this video.';
// How far past the limit a seek may land, so small seeks the browser or Shaka make while playing
// at the limit (such as jumping a gap between segments) are not refused.
const SEEK_LIMIT_TOLERANCE_SECONDS = 1;
const FAILURE_MESSAGE = 'The video could not be played.';

// Shaka always listens on the whole page in fullscreen; this only moves the listener outside it.
function configureKeyboard(overlay: ShakaOverlay, scope: 'player' | 'page'): void {
	overlay.configure({ enableKeyboardPlaybackControlsInWindow: scope === 'page' });
}

function findTextTrack(tracks: ShakaTextTrack[], language: string | undefined): ShakaTextTrack | undefined {
	if (!language) return tracks[0];
	const wanted = language.toLowerCase();
	return tracks.find((track) => track.language.toLowerCase() === wanted) ?? tracks.find((track) => track.language.toLowerCase().split('-')[0] === wanted.split('-')[0]);
}

function applyCaptions(player: ShakaPlayer, captions: VideoPlayerCaptions | undefined): void {
	if (!captions) return;
	if (!captions.enabled) {
		player.selectTextTrack(null);
		return;
	}
	const track = findTextTrack(player.getTextTracks(), captions.language);
	if (track) player.selectTextTrack(track);
}

// Shaka applies the start position from its own `loadedmetadata` listener, which can fire
// after `load()` resolves; a seek made before then would be overwritten.
function whenMetadataLoaded(video: HTMLVideoElement): Promise<void> {
	if (video.readyState >= HTMLMediaElement.HAVE_METADATA) return Promise.resolve();
	return new Promise((resolve) => {
		video.addEventListener('loadedmetadata', () => resolve(), { once: true });
	});
}

function createHandle(element: HTMLVideoElement, allowedUntil: () => number | undefined): VideoPlayerHandle {
	return {
		element,
		play: () => element.play(),
		pause: () => element.pause(),
		seek: (seconds) => {
			element.currentTime = seconds;
		},
		get allowedUntil() {
			return allowedUntil();
		},
	};
}

/**
 * Plays adaptive (DASH/HLS) or progressive video with Shaka Player, typically
 * streamed directly from Azure Blob Storage using a read-only SAS token.
 *
 * @param props - Source, optional SAS token, presentation options, and lifecycle callbacks.
 * @returns A container with the video element, Shaka controls, and an inline error message on failure.
 *
 * @remarks
 * - Shaka Player and its control styles are loaded lazily on first render, so they only
 *   add to the bundle of pages that show a video.
 * - The player is destroyed on unmount and recreated when `src`, `sasToken`, `controls`, or `textTracks` change.
 * - Captions come from text tracks in the manifest and from `textTracks`; viewers toggle them from the
 *   control bar, and `captions` sets the initial state and language.
 * - Failures are reported through `onError` as a {@link VideoPlayerError}. Fatal ones are also rendered as an
 *   inline `role="alert"` message. Loads cancelled by unmounting or a source change are not reported.
 * - The storage account must allow CORS `GET`/`HEAD` requests from the page origin.
 *
 * @example
 * ```tsx
 * import { VideoPlayer } from '@cellix/ui-video-player';
 *
 * <VideoPlayer
 *   src="https://myaccount.blob.core.windows.net/videos/intro/manifest.mpd"
 *   sasToken={playback.sasToken}
 *   title="Introduction"
 *   textTracks={[{ src: captionsUrl, language: 'es', label: 'Español' }]}
 *   captions={{ enabled: true, language: 'en' }}
 *   onError={(error) => console.warn(error.category)}
 * />
 * ```
 */
export const VideoPlayer: FC<VideoPlayerProps> = ({
	src,
	sasToken,
	textTracks,
	captions,
	seekLimit,
	poster,
	title,
	autoPlay = false,
	muted = false,
	loop = false,
	controls = true,
	keyboardScope = 'player',
	className,
	style,
	onReady,
	onError,
	onSeekBlocked,
}) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const videoRef = useRef<HTMLVideoElement>(null);
	const [error, setError] = useState<VideoPlayerError>();

	// Callbacks are read through refs so a new function identity does not reload the video.
	const onReadyRef = useRef(onReady);
	const onErrorRef = useRef(onError);
	const onSeekBlockedRef = useRef(onSeekBlocked);
	onReadyRef.current = onReady;
	onErrorRef.current = onError;
	onSeekBlockedRef.current = onSeekBlocked;
	// The furthest position viewers can seek to, for the source it was reached in.
	const seekLimitRef = useRef<{ src: string; furthest: number }>(undefined);
	// The overlay is configured when it is created from this ref and afterwards by its own effect.
	const keyboardScopeRef = useRef(keyboardScope);
	keyboardScopeRef.current = keyboardScope;
	const overlayRef = useRef<ShakaOverlay>(undefined);
	// Captions are applied at load time from this ref and afterwards by their own effect.
	const captionsRef = useRef(captions);
	captionsRef.current = captions;
	const loadedPlayerRef = useRef<ShakaPlayer>(undefined);
	// Teardown of the previous player. A reload waits for it, because destroying a
	// player detaches it from the video element the next player attaches to.
	const releasingRef = useRef<Promise<unknown>>(Promise.resolve());
	// Serialized so a new array with the same tracks does not reload the video.
	const textTracksKey = JSON.stringify(textTracks ?? []);

	useEffect(() => {
		const container = containerRef.current;
		const video = videoRef.current;
		if (!container || !video) return;

		let disposed = false;
		let release: (() => Promise<unknown>) | undefined;
		setError(undefined);

		const report = (cause: unknown, overrides?: Parameters<typeof toVideoPlayerError>[1]) => {
			if (disposed || isLoadInterruption(cause)) return;
			const playerError = toVideoPlayerError(cause, overrides);
			if (playerError.fatal) setError(playerError);
			onErrorRef.current?.(playerError);
		};

		const addTextTracks = async (player: ShakaPlayer) => {
			const tracks = JSON.parse(textTracksKey) as VideoPlayerTextTrack[];
			const results = await Promise.allSettled(tracks.map((track) => player.addTextTrackAsync(track.src, track.language, track.kind ?? 'captions', track.mimeType, undefined, track.label)));
			for (const result of results) {
				if (result.status === 'rejected') report(result.reason, { category: 'captions', fatal: false });
			}
		};

		const start = async () => {
			const shaka = await loadShaka();
			await releasingRef.current;
			if (disposed) return;
			if (!shaka.Player.isBrowserSupported()) {
				throw new VideoPlayerError('unsupported-browser', UNSUPPORTED_MESSAGE);
			}

			const player: ShakaPlayer = new shaka.Player();
			if (controls) {
				const overlay = new shaka.ui.Overlay(player, container, video);
				configureKeyboard(overlay, keyboardScopeRef.current);
				overlayRef.current = overlay;
				release = () => overlay.destroy();
			} else {
				release = () => player.destroy();
			}

			player.addEventListener('error', (event) => report((event as CustomEvent).detail));
			if (sasToken) {
				const appendSasToken = createSasTokenAppender(src, sasToken);
				player.getNetworkingEngine()?.registerRequestFilter((_type, request) => {
					request.uris = request.uris.map(appendSasToken);
				});
			}

			await player.attach(video);
			await player.load(src);
			if (disposed) return;
			await whenMetadataLoaded(video);
			if (disposed) return;
			await addTextTracks(player);
			if (disposed) return;
			loadedPlayerRef.current = player;
			applyCaptions(player, captionsRef.current);
			onReadyRef.current?.(createHandle(video, () => seekLimitRef.current?.furthest));
		};

		// Anything that stops the source from loading is fatal, whatever Shaka's severity.
		start().catch((cause: unknown) => report(cause, { fatal: true }));

		return () => {
			disposed = true;
			loadedPlayerRef.current = undefined;
			overlayRef.current = undefined;
			releasingRef.current = (release?.() ?? Promise.resolve()).catch(() => {
				// Teardown failures are not actionable once the component is gone.
			});
		};
	}, [src, sasToken, controls, textTracksKey]);

	useEffect(() => {
		if (overlayRef.current) configureKeyboard(overlayRef.current, keyboardScope);
	}, [keyboardScope]);

	const captionsEnabled = captions?.enabled;
	const captionsLanguage = captions?.language;
	useEffect(() => {
		const player = loadedPlayerRef.current;
		if (player && captionsEnabled !== undefined) applyCaptions(player, { enabled: captionsEnabled, language: captionsLanguage });
	}, [captionsEnabled, captionsLanguage]);

	const allowedUntil = seekLimit?.allowedUntil;
	useEffect(() => {
		const video = videoRef.current;
		if (!video || allowedUntil === undefined) {
			seekLimitRef.current = undefined;
			return;
		}
		const previous = seekLimitRef.current?.src === src ? seekLimitRef.current.furthest : 0;
		const limit = { src, furthest: Math.max(previous, allowedUntil) };
		seekLimitRef.current = limit;
		// Where the playhead was at the last timeupdate, or undefined just after a seek. Moving forward
		// from a position within the limit without seeking means that span was played.
		let last: number | undefined;

		const onSeeking = () => {
			last = undefined;
			const attempted = video.currentTime;
			if (attempted > limit.furthest + SEEK_LIMIT_TOLERANCE_SECONDS) {
				video.currentTime = limit.furthest;
				onSeekBlockedRef.current?.({ attempted, allowedUntil: limit.furthest });
			}
		};
		const onTimeUpdate = () => {
			const time = video.currentTime;
			if (last !== undefined && time > last && last <= limit.furthest + SEEK_LIMIT_TOLERANCE_SECONDS) {
				limit.furthest = Math.max(limit.furthest, time);
			}
			last = time;
		};

		if (video.currentTime > limit.furthest + SEEK_LIMIT_TOLERANCE_SECONDS) {
			video.currentTime = limit.furthest;
		}
		video.addEventListener('seeking', onSeeking);
		video.addEventListener('timeupdate', onTimeUpdate);
		return () => {
			video.removeEventListener('seeking', onSeeking);
			video.removeEventListener('timeupdate', onTimeUpdate);
		};
	}, [src, allowedUntil]);

	return (
		<div
			className={className}
			style={style}
		>
			<div
				ref={containerRef}
				style={{ position: 'relative', width: '100%' }}
			>
				<video
					ref={videoRef}
					title={title}
					poster={poster}
					autoPlay={autoPlay}
					muted={muted}
					loop={loop}
					playsInline
					style={{ display: 'block', width: '100%', height: '100%' }}
				/>
			</div>
			{error ? <div role="alert">{error.category === 'unsupported-browser' ? UNSUPPORTED_MESSAGE : FAILURE_MESSAGE}</div> : null}
		</div>
	);
};
