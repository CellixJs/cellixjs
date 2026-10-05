import { type EncodeVideoResult, ServiceVideoEncoding, type ServiceVideoEncodingOptions, VideoEncodingError, type VideoEncodingProgress } from '@ocom/service-video-encoding';
import { createApiBlobStorage } from './api-blob-storage.ts';

type BlobTransfers = ServiceVideoEncodingOptions['blobStorage'];

import type { EncoderApiClient } from './api-client.ts';

export interface EncodeVideoOptions {
	api: EncoderApiClient;
	videoId: string;
	/** Executable paths and working directory for ffmpeg, ffprobe, and shaka-packager. */
	tools?: Omit<ServiceVideoEncodingOptions, 'blobStorage'>;
	signal?: AbortSignal;
	onProgress?: (progress: VideoEncodingProgress) => void;
	fetch?: typeof fetch;
}

/**
 * Failure codes that describe this machine rather than the video, or a
 * deliberate stop. They are not recorded, so the video stays `ENCODING` and
 * can be retried or taken over.
 */
const UNRECORDED_FAILURES = new Set(['aborted', 'tool-unavailable']);

/**
 * Encodes one video end to end on this machine (ADR 0036):
 *
 * 1. checks ffmpeg, ffprobe, and shaka-packager, then starts encoding through the API, which marks the video `ENCODING` and
 *    returns a read link for the original and the output destination;
 * 2. encodes it locally with ffmpeg and shaka-packager, uploading each output
 *    file through a write link issued by the API;
 * 3. records the result: `READY` with the manifests, or `FAILED` with the
 *    error code and message.
 *
 * @returns The encoding result when the video is ready.
 * @throws The underlying error after recording it. Aborts and missing tools
 * are not recorded, so the video can be encoded again.
 */
export async function encodeVideo(options: EncodeVideoOptions): Promise<EncodeVideoResult> {
	const { api, videoId } = options;
	// Bound once the API has started encoding and issued the source link.
	let transfers: BlobTransfers | undefined;
	const bound = (): BlobTransfers => {
		if (!transfers) {
			throw new Error('Blob transfers are not available before encoding starts');
		}
		return transfers;
	};
	const service = new ServiceVideoEncoding({
		...options.tools,
		blobStorage: {
			downloadToFile: (request) => bound().downloadToFile(request),
			uploadFile: (request) => bound().uploadFile(request),
		},
	});

	try {
		// Check the tools first, so a machine without ffmpeg never marks the video ENCODING.
		const encoder = await service.startUp();
		const start = await api.startEncoding(videoId);
		transfers = createApiBlobStorage({
			api,
			videoId,
			sourceUrl: start.sourceUrl,
			outputPrefix: start.outputPrefix,
			...(options.fetch ? { fetch: options.fetch } : {}),
		});
		const result = await encoder.encode(
			{
				// The source address is not used: the API blob storage downloads from the read link.
				source: { containerName: 'source', blobName: 'source' },
				destination: { containerName: start.outputContainerName, prefix: start.outputPrefix },
			},
			{
				...(options.signal ? { signal: options.signal } : {}),
				...(options.onProgress ? { onProgress: options.onProgress } : {}),
			},
		);
		await api.recordSucceeded(videoId, {
			dashManifestPath: relativeTo(start.outputPrefix, result.manifests.dash.blobName),
			hlsManifestPath: relativeTo(start.outputPrefix, result.manifests.hls.blobName),
			durationSeconds: result.durationSeconds,
			// The short side of each rendition, so portrait video reads as 1080p, 720p, and so on.
			renditionHeights: result.renditions.map((rendition) => Math.min(rendition.width, rendition.height)),
		});
		return result;
	} catch (error) {
		if (transfers && error instanceof VideoEncodingError && !UNRECORDED_FAILURES.has(error.code)) {
			await api.recordFailed(videoId, { code: error.code, message: error.message.slice(0, 2000) });
		}
		throw error;
	} finally {
		await service.shutDown();
	}
}

function relativeTo(prefix: string, blobName: string): string {
	return blobName.startsWith(prefix) ? blobName.slice(prefix.length) : blobName;
}
