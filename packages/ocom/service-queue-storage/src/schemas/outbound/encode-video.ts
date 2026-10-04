import { defineQueue } from '@cellix/service-queue-storage';
import { type Schema as EncodeVideoPayload, schema as encodeVideoSchema } from './encode-video.schema.generated.ts';

export type { EncodeVideoPayload };

/**
 * Video encoding requests. Outbound for the API, which enqueues an upload for
 * encoding, and inbound for the video encoding worker, which registers the
 * same definition in `ServiceVideoWorkerQueueStorage`.
 */
export const encodeVideoQueue = defineQueue<EncodeVideoPayload>()(({ $payload }) => ({
	queueName: 'encode-video',
	schema: encodeVideoSchema,
	loggingTags: { domain: 'video', type: 'encode', videoId: $payload.videoId },
}));
