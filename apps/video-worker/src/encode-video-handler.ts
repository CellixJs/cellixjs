import type { EncodeVideoPayload } from '@ocom/service-queue-storage';
import { type VideoEncoding, VideoEncodingError, type VideoEncodingStage } from '@ocom/service-video-encoding';
import type { WorkerLogger } from './log.ts';

/** The fields of a received `encode-video` message the handler uses. */
interface EncodeVideoMessage {
	id: string;
	payload: EncodeVideoPayload;
	dequeueCount?: number;
}

export type EncodeVideoMessageHandler = (message: EncodeVideoMessage, context: { signal: AbortSignal }) => Promise<void>;

const PERMANENT_ERROR_CODES = new Set(['source-not-found', 'unsupported-source']);

/**
 * Whether an encoding failure should poison the message instead of retrying
 * it. A missing or unreadable source will not succeed on retry. Everything
 * else, including storage and tool failures, may be transient.
 */
export function isPermanentEncodingFailure(error: unknown): boolean {
	return error instanceof VideoEncodingError && PERMANENT_ERROR_CODES.has(error.code);
}

/**
 * Creates the handler that encodes one `encode-video` message and logs the
 * outcome keyed by `videoId`. Failures are logged and rethrown so the queue
 * processor can retry or poison the message.
 */
export function createEncodeVideoHandler(encoder: Pick<VideoEncoding, 'encode'>, logger: WorkerLogger): EncodeVideoMessageHandler {
	return async (message, { signal }) => {
		const { videoId, source, destination } = message.payload;
		logger.info('encode.started', { videoId, messageId: message.id, dequeueCount: message.dequeueCount, source, destination });

		const startedStages = new Set<VideoEncodingStage>();
		const result = await encoder.encode(
			{ source, destination },
			{
				signal,
				onProgress: ({ stage }) => {
					if (!startedStages.has(stage)) {
						startedStages.add(stage);
						logger.info('encode.stage', { videoId, stage });
					}
				},
			},
		);

		logger.info('encode.completed', {
			videoId,
			manifests: result.manifests,
			durationSeconds: result.durationSeconds,
			renditions: result.renditions,
			hasAudio: result.hasAudio,
			textTracks: result.textTracks,
		});
	};
}
