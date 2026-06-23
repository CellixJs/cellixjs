import type { PayloadFieldProxy, QueueDefinition } from './interfaces.ts';
import { payloadFields } from './logging-fields.ts';

type DefineQueueContext<TPayload extends object> = {
	$payload: PayloadFieldProxy<TPayload>;
};

/**
 * Creates a strongly-typed queue definition helper for a specific payload type.
 *
 * This is the preferred consumer-facing API for queue definitions because it keeps
 * the `$payload.fieldName` syntax while avoiding per-file setup boilerplate.
 *
 * @typeParam TPayload - Message payload type for the queue definition.
 * @returns A helper that accepts either a plain queue definition or a callback
 * that receives a typed `$payload` proxy for payload-derived logging fields.
 *
 * @remarks
 * The returned helper is typically called immediately:
 * `defineQueue<MyPayload>()(({ $payload }) => ({ ... }))`.
 * This keeps queue definitions concise while preserving payload-key safety for
 * logging tags and metadata.
 *
 * @example
 * ```ts
 * import { defineQueue } from '@cellix/service-queue-storage';
 *
 * interface CommunityCreationPayload {
 *   communityId: string;
 *   createdBy: string;
 * }
 *
 * export const communityCreationQueue = defineQueue<CommunityCreationPayload>()(({ $payload }) => ({
 *   queueName: 'community-creation',
 *   schema,
 *   loggingMetadata: {
 *     communityId: $payload.communityId,
 *     createdBy: $payload.createdBy,
 *   },
 * }));
 * ```
 */
export function defineQueue<TPayload extends object>() {
	return (definition: QueueDefinition<TPayload> | ((context: DefineQueueContext<TPayload>) => QueueDefinition<TPayload>)): QueueDefinition<TPayload> => {
		if (typeof definition === 'function') {
			return definition({ $payload: payloadFields<TPayload>() });
		}
		return definition;
	};
}
