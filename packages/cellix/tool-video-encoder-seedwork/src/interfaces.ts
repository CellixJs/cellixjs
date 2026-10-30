import type { BlobAddress, BlobStorage } from '@cellix/service-blob-storage';

/**
 * Describes one video encoding job.
 *
 * The request is plain, JSON-serializable data so that it can be stored as-is
 * in a queue message and handed to `VideoEncoding.encode()` by a worker.
 * Runtime-only concerns such as cancellation and progress reporting live in
 * {@link EncodeVideoOptions} instead.
 *
 * @example
 * ```ts
 * const request: EncodeVideoRequest = {
 *   source: { containerName: 'uploads', blobName: 'raw/abc123.mov' },
 *   destination: { containerName: 'videos', prefix: 'abc123/' },
 * };
 * ```
 *
 * @property source - Blob containing the original video file. Any container
 * format and codec that ffmpeg can decode is accepted.
 * @property destination - Container and blob-name prefix that receives the
 * manifests and segments. A trailing `/` is added to a non-empty prefix when
 * missing. Existing blobs with the same names are overwritten.
 */
export interface EncodeVideoRequest {
	source: BlobAddress;
	destination: {
		containerName: string;
		prefix: string;
	};
}

/**
 * Stage of an encoding job, reported through {@link VideoEncodingProgress}.
 *
 * Stages always run in this order: `downloading`, `probing`, `encoding`,
 * `packaging`, `uploading`.
 */
export type VideoEncodingStage = 'downloading' | 'probing' | 'encoding' | 'packaging' | 'uploading';

/**
 * Progress update emitted while an encoding job runs.
 *
 * Every stage reports `percent: 0` when it starts and `percent: 100` when it
 * finishes. The `encoding` stage additionally reports intermediate values based
 * on how much of the source ffmpeg has processed, and `uploading` reports the
 * share of output files stored so far.
 *
 * @property stage - The stage currently running.
 * @property percent - Whole-number completion of the current stage, from 0 to 100.
 */
export interface VideoEncodingProgress {
	stage: VideoEncodingStage;
	percent: number;
}

/**
 * Runtime options for a single `encode()` call.
 *
 * These are kept separate from {@link EncodeVideoRequest} because they cannot
 * be serialized into a queue message.
 *
 * @property signal - Aborts the job. Running ffmpeg or packager processes are
 * killed and the promise rejects with a `VideoEncodingError` whose code is
 * `aborted`.
 * @property onProgress - Called synchronously with stage and percent updates.
 * Exceptions thrown by the callback are ignored.
 */
export interface EncodeVideoOptions {
	signal?: AbortSignal;
	onProgress?: (progress: VideoEncodingProgress) => void;
}

/**
 * One video quality level ("rung") produced by an encoding job.
 *
 * @property width - Output width in pixels.
 * @property height - Output height in pixels.
 * @property videoBitrateKbps - Target average H.264 video bitrate in kilobits per second.
 */
export interface EncodedRendition {
	width: number;
	height: number;
	videoBitrateKbps: number;
}

/**
 * A text track extracted from the source's embedded subtitles.
 *
 * @property language - Language tag reported by the source file, such as
 * `eng` or `en`, or `und` when the source does not declare one.
 */
export interface EncodedTextTrack {
	language: string;
}

/**
 * Outcome of a successful encoding job.
 *
 * Both manifests reference their segments with relative URLs, so the whole
 * output can be served from the destination prefix with a single
 * prefix-scoped or container-scoped read SAS.
 *
 * @example
 * ```ts
 * const result = await encoder.encode(request);
 * result.manifests.dash; // { containerName: 'videos', blobName: 'abc123/manifest.mpd' }
 * result.manifests.hls;  // { containerName: 'videos', blobName: 'abc123/master.m3u8' }
 * ```
 *
 * @property manifests - Addresses of the DASH (`manifest.mpd`) and HLS
 * (`master.m3u8`) manifests.
 * @property durationSeconds - Duration of the source video in seconds.
 * @property renditions - Video quality levels produced, from highest to lowest.
 * @property hasAudio - Whether an AAC audio track was produced. It is `false`
 * when the source has no audio stream.
 * @property textTracks - WebVTT text tracks produced from embedded text
 * subtitles, in source order. Image-based subtitles are skipped.
 */
export interface EncodeVideoResult {
	manifests: {
		dash: BlobAddress;
		hls: BlobAddress;
	};
	durationSeconds: number;
	renditions: EncodedRendition[];
	hasAudio: boolean;
	textTracks: EncodedTextTrack[];
}

/**
 * Framework-level contract for encoding a video into adaptive-bitrate output.
 *
 * Consumers depend on this interface and obtain an implementation by starting
 * a `ServiceVideoEncoding`.
 */
export interface VideoEncoding {
	/**
	 * Encodes a source video blob into H.264/AAC fMP4 segments with DASH and
	 * HLS manifests, and stores the output under the destination prefix.
	 *
	 * The source is downloaded to a private temporary directory, which is
	 * removed when the job finishes, whether it succeeds or fails. Manifests
	 * are uploaded after every segment so a manifest never references missing
	 * files. A failed or aborted job may leave segments, but no manifests,
	 * under the destination prefix.
	 *
	 * @param request - Serializable job description.
	 * @param options - Optional abort signal and progress callback.
	 * @returns The manifest addresses and a summary of what was produced.
	 * @throws {VideoEncodingError} For every expected failure, with a `code`
	 * describing the cause.
	 */
	encode(request: EncodeVideoRequest, options?: EncodeVideoOptions): Promise<EncodeVideoResult>;
}

/**
 * Options for constructing a `ServiceVideoEncoding`.
 *
 * The path options accept `undefined` so values can be passed straight from
 * environment variables; `undefined` selects the default.
 *
 * @property blobStorage - Blob operations used to read the source and write
 * the output. A started `ServiceBlobStorage` or `ServiceClientBlobStorage`
 * from `@cellix/service-blob-storage` satisfies this.
 * @property ffmpegPath - ffmpeg executable. Defaults to `ffmpeg` on `PATH`.
 * The build must include the `libx264` and `aac` encoders.
 * @property ffprobePath - ffprobe executable. Defaults to `ffprobe` on `PATH`.
 * @property packagerPath - shaka-packager executable. Defaults to `packager`
 * on `PATH`.
 * @property workingDirectory - Directory under which per-job temporary
 * directories are created. Defaults to the operating system temp directory.
 * It needs free space for the source plus roughly twice its encoded size.
 */
export interface ServiceVideoEncodingOptions {
	blobStorage: Pick<BlobStorage, 'downloadToFile' | 'uploadFile'>;
	ffmpegPath?: string | undefined;
	ffprobePath?: string | undefined;
	packagerPath?: string | undefined;
	workingDirectory?: string | undefined;
}
