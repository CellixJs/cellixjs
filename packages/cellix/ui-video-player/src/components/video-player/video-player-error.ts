/**
 * Coarse classification of why a {@link VideoPlayer} could not play its source.
 *
 * - `unsupported-browser`: the browser lacks Media Source Extensions or another capability Shaka Player requires
 * - `network`: a manifest, segment, or license request failed (including expired or invalid SAS tokens)
 * - `manifest`: the manifest could not be parsed or contains no playable streams
 * - `media`: the browser could not decode or buffer the media
 * - `drm`: content protection could not be negotiated
 * - `captions`: a caption or subtitle track could not be loaded or parsed; playback continues
 * - `unknown`: any other failure
 */
export type VideoPlayerErrorCategory = 'unsupported-browser' | 'network' | 'manifest' | 'media' | 'drm' | 'captions' | 'unknown';

/**
 * Error reported by {@link VideoPlayer} through its `onError` callback.
 *
 * Wraps the underlying Shaka Player error so consumers can branch on a stable
 * {@link VideoPlayerErrorCategory} without depending on Shaka types.
 *
 * @param category - Stable classification of the failure.
 * @param message - Human-readable description.
 * @param options - Optional Shaka error `code`, the original `cause`, and whether the error is `fatal` (defaults to `true`).
 * @returns An `Error` subclass with `name` set to `'VideoPlayerError'`, plus `category`, `code`, and `fatal`.
 *
 * @example
 * ```tsx
 * <VideoPlayer
 *   src={url}
 *   onError={(error) => {
 *     if (error.category === 'network') refreshSasToken();
 *   }}
 * />
 * ```
 */
export class VideoPlayerError extends Error {
	/** Stable classification of the failure. */
	readonly category: VideoPlayerErrorCategory;
	/** Shaka Player error code, when the failure originated in Shaka. See the Shaka `shaka.util.Error.Code` reference. */
	readonly code: number | undefined;
	/**
	 * `true` when playback stopped or could not start; the player then shows its inline alert.
	 * `false` for recoverable problems (for example a failed caption file or a retried segment) while playback continues.
	 */
	readonly fatal: boolean;

	constructor(category: VideoPlayerErrorCategory, message: string, options?: { code?: number | undefined; cause?: unknown; fatal?: boolean }) {
		super(message, { cause: options?.cause });
		this.name = 'VideoPlayerError';
		this.category = category;
		this.code = options?.code;
		this.fatal = options?.fatal ?? true;
	}
}

// Numeric values of shaka.util.Error.Category / Code; Shaka exposes them as runtime enums only.
const SHAKA_CATEGORY: Record<number, VideoPlayerErrorCategory> = {
	1: 'network',
	2: 'captions',
	3: 'media',
	4: 'manifest',
	5: 'media',
	6: 'drm',
};
const SHAKA_LOAD_INTERRUPTED = 7000;
const SHAKA_OBJECT_DESTROYED = 7003;
const SHAKA_SEVERITY_CRITICAL = 2;

interface ShakaErrorLike {
	category: number;
	code: number;
	severity?: number;
}

function isShakaError(value: unknown): value is ShakaErrorLike {
	return typeof value === 'object' && value !== null && typeof (value as ShakaErrorLike).category === 'number' && typeof (value as ShakaErrorLike).code === 'number';
}

/** Whether the failure only means a load was superseded by unmounting or a source change. */
export function isLoadInterruption(value: unknown): boolean {
	return isShakaError(value) && (value.code === SHAKA_LOAD_INTERRUPTED || value.code === SHAKA_OBJECT_DESTROYED);
}

/**
 * Normalizes any thrown value into a VideoPlayerError. Shaka errors are fatal when
 * their severity is CRITICAL; `overrides` force a category or fatality for a call site.
 */
export function toVideoPlayerError(value: unknown, overrides: { category?: VideoPlayerErrorCategory; fatal?: boolean } = {}): VideoPlayerError {
	if (value instanceof VideoPlayerError) return value;
	if (isShakaError(value)) {
		const category = overrides.category ?? SHAKA_CATEGORY[value.category] ?? 'unknown';
		const fatal = overrides.fatal ?? value.severity === SHAKA_SEVERITY_CRITICAL;
		return new VideoPlayerError(category, `Video playback failed (Shaka error ${value.code}).`, { code: value.code, cause: value, fatal });
	}
	const message = value instanceof Error ? value.message : 'Video playback failed.';
	return new VideoPlayerError(overrides.category ?? 'unknown', message, { cause: value, fatal: overrides.fatal ?? true });
}
