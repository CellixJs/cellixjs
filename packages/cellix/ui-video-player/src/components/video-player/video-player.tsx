import { type CSSProperties, type FC, useEffect, useRef, useState } from 'react';
import { createSasTokenAppender } from './sas-token.ts';
import { loadShaka, type ShakaPlayer, type ShakaTextTrack } from './shaka-loader.ts';
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
	/** Moves the playhead to the given position, in seconds. */
	seek(seconds: number): void;
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
const FAILURE_MESSAGE = 'The video could not be played.';

const SHAKA_TEXT_KIND = { captions: 'caption', subtitles: 'subtitle' } as const;

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

function createHandle(element: HTMLVideoElement): VideoPlayerHandle {
	return {
		element,
		play: () => element.play(),
		pause: () => element.pause(),
		seek: (seconds) => {
			element.currentTime = seconds;
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
export const VideoPlayer: FC<VideoPlayerProps> = ({ src, sasToken, textTracks, captions, poster, title, autoPlay = false, muted = false, loop = false, controls = true, className, style, onReady, onError }) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const videoRef = useRef<HTMLVideoElement>(null);
	const [error, setError] = useState<VideoPlayerError>();

	// Callbacks are read through refs so a new function identity does not reload the video.
	const onReadyRef = useRef(onReady);
	const onErrorRef = useRef(onError);
	onReadyRef.current = onReady;
	onErrorRef.current = onError;
	// Captions are applied at load time from this ref and afterwards by their own effect.
	const captionsRef = useRef(captions);
	captionsRef.current = captions;
	const loadedPlayerRef = useRef<ShakaPlayer>(undefined);
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
			const results = await Promise.allSettled(tracks.map((track) => player.addTextTrackAsync(track.src, track.language, SHAKA_TEXT_KIND[track.kind ?? 'captions'], track.mimeType, undefined, track.label)));
			for (const result of results) {
				if (result.status === 'rejected') report(result.reason, { category: 'captions', fatal: false });
			}
		};

		const start = async () => {
			const shaka = await loadShaka();
			if (disposed) return;
			if (!shaka.Player.isBrowserSupported()) {
				throw new VideoPlayerError('unsupported-browser', UNSUPPORTED_MESSAGE);
			}

			const player: ShakaPlayer = new shaka.Player();
			if (controls) {
				const overlay = new shaka.ui.Overlay(player, container, video);
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
			onReadyRef.current?.(createHandle(video));
		};

		// Anything that stops the source from loading is fatal, whatever Shaka's severity.
		start().catch((cause: unknown) => report(cause, { fatal: true }));

		return () => {
			disposed = true;
			loadedPlayerRef.current = undefined;
			release?.().catch(() => {
				// Teardown failures are not actionable once the component is gone.
			});
		};
	}, [src, sasToken, controls, textTracksKey]);

	const captionsEnabled = captions?.enabled;
	const captionsLanguage = captions?.language;
	useEffect(() => {
		const player = loadedPlayerRef.current;
		if (player && captionsEnabled !== undefined) applyCaptions(player, { enabled: captionsEnabled, language: captionsLanguage });
	}, [captionsEnabled, captionsLanguage]);

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
