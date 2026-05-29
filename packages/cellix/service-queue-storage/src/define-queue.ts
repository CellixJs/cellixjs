import type { PayloadFieldProxy, QueueDefinition } from './interfaces.js';
import { payloadFields } from './logging-fields.js';

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
 * @example
 * ```ts
 * import { defineQueue } from '@cellix/service-queue-storage';
 *
 * interface CommunityCreationMessage {
 *   communityId: string;
 *   createdBy: string;
 * }
 *
 * export const communityCreationQueue = defineQueue<CommunityCreationMessage>()(({ $payload }) => ({
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
	return (
		definition: QueueDefinition<TPayload> | ((context: DefineQueueContext<TPayload>) => QueueDefinition<TPayload>),
	): QueueDefinition<TPayload> => {
		if (typeof definition === 'function') {
			return definition({ $payload: payloadFields<TPayload>() });
		}
		return definition;
	};
}
