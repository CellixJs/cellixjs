export type {
	EncodedRendition,
	EncodedTextTrack,
	EncodeVideoOptions,
	EncodeVideoRequest,
	EncodeVideoResult,
	ServiceVideoEncodingOptions,
	VideoEncoding,
	VideoEncodingProgress,
	VideoEncodingStage,
} from './interfaces.ts';
/**
 * Cellix infrastructure service that encodes a video blob into
 * adaptive-bitrate H.264/AAC output with DASH and HLS manifests.
 *
 * `startUp()` verifies that ffmpeg (with `libx264` and `aac`), ffprobe, and
 * shaka-packager can be run, and rejects with a `VideoEncodingError` whose
 * code is `tool-unavailable` otherwise. `shutDown()` aborts any jobs still
 * running.
 *
 * Each job encodes the source into the default ladder (1080p, 720p, 480p,
 * 360p at 5000, 2800, 1400, and 800 kbps), keeping only rungs no larger than
 * the source, plus one 128 kbps stereo AAC track and a WebVTT track for each
 * embedded text subtitle. Segments are 2 seconds long.
 *
 * @returns A service whose `startUp()` resolves to the `VideoEncoding`
 * contract once the required executables have been verified.
 *
 * @example
 * ```ts
 * const encoder = await new ServiceVideoEncoding({ blobStorage }).startUp();
 *
 * const result = await encoder.encode(
 *   {
 *     source: { containerName: 'uploads', blobName: 'raw/abc123.mov' },
 *     destination: { containerName: 'videos', prefix: 'abc123/' },
 *   },
 *   { onProgress: ({ stage, percent }) => console.log(stage, percent) },
 * );
 *
 * console.log(result.manifests.dash.blobName); // 'abc123/manifest.mpd'
 * ```
 */
export { ServiceVideoEncoding } from './service-video-encoding.ts';
/**
 * Error thrown for every expected failure of `ServiceVideoEncoding`.
 *
 * Inspect `code` to decide how to react. In a queue-triggered worker,
 * `source-not-found` and `unsupported-source` are permanent and should not be
 * retried. `storage-failed` and `encode-failed` may be transient.
 *
 * @returns An `Error` subclass with `name` set to `VideoEncodingError`, a
 * stable `code`, and the underlying failure, if any, in `cause`.
 *
 * @example
 * ```ts
 * try {
 *   await encoder.encode(request);
 * } catch (error) {
 *   if (error instanceof VideoEncodingError && error.code === 'unsupported-source') {
 *     // mark the upload as rejected instead of retrying
 *   }
 *   throw error;
 * }
 * ```
 */
export { VideoEncodingError, type VideoEncodingErrorCode } from './video-encoding-error.ts';
