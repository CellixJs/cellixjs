/**
 * Reason a video encoding operation failed.
 *
 * - `tool-unavailable`: ffmpeg, ffprobe, or shaka-packager could not be run,
 *   or the ffmpeg build lacks the `libx264` or `aac` encoder.
 * - `source-not-found`: the source blob does not exist.
 * - `unsupported-source`: the source could not be read as a video, has no
 *   video stream, or has no known duration.
 * - `encode-failed`: ffmpeg exited with an error while encoding.
 * - `packaging-failed`: shaka-packager exited with an error.
 * - `storage-failed`: a blob download or upload failed for a reason other
 *   than a missing source.
 * - `aborted`: the job was cancelled through its abort signal or by
 *   `shutDown()`.
 */
export type VideoEncodingErrorCode = 'tool-unavailable' | 'source-not-found' | 'unsupported-source' | 'encode-failed' | 'packaging-failed' | 'storage-failed' | 'aborted';

export class VideoEncodingError extends Error {
	public readonly code: VideoEncodingErrorCode;

	constructor(code: VideoEncodingErrorCode, message: string, options?: { cause?: unknown }) {
		super(message, options);
		this.name = 'VideoEncodingError';
		this.code = code;
	}
}
