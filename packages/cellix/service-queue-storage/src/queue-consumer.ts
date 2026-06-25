import { diag } from '@opentelemetry/api';
import type { MessagePayload, QueueMap, QueueTriggerMetadata } from './interfaces.ts';
import type { InternalQueueTransport } from './internal-queue-storage-service.ts';
import { resolveLoggingFields } from './logging-fields.ts';
import type { MessageLogEnvelope } from './logging.ts';
import { formatQueueValidationErrors, type QueuePayloadValidator } from './validation.ts';

type Capitalize<S extends string> = S extends `${infer F}${infer R}` ? `${Uppercase<F>}${R}` : S;

/**
 * Public consumer methods generated for an application's inbound queues.
 *
 * Each queue key becomes a strongly-typed `receiveFrom...Queue` method and a
 * matching `peekAt...Queue` method on the registered service surface.
 *
 * @typeParam I - Inbound queue definition map passed to `registerQueues()`.
 *
 * @example
 * ```ts
 * const inbound = { importRequests: importRequestsQueue };
 * const queues = registerQueues({
 *   outbound: {},
 *   inbound,
 * });
 *
 * type Consumer = QueueConsumerContext<typeof inbound>;
 * // service.receiveFromImportRequestsQueue(payload, metadata)
 * ```
 */
export type QueueConsumerContext<I extends QueueMap> = {
	[K in keyof I as `receiveFrom${Capitalize<string & K>}Queue`]: (
		payload: unknown,
		metadata?: QueueTriggerMetadata,
	) => Promise<QueueMessage<MessagePayload<I[K]>>>;
} & {
	[K in keyof I as `peekAt${Capitalize<string & K>}Queue`]: (maxMessages?: number) => Promise<QueueMessage<MessagePayload<I[K]>>[]>;
};

type QueueMessage<T> = { id: string; popReceipt?: string; payload: T; dequeueCount?: number };

export function createQueueConsumer<I extends QueueMap>(
	service: Pick<InternalQueueTransport, 'peekMessages' | 'getLogger' | 'isLoggingEnabled' | 'shouldAwaitLogging'>,
	definitions: I,
	validators: Record<string, QueuePayloadValidator>,
): QueueConsumerContext<I> {
	const context = {} as Record<string, unknown>;

	for (const [key, def] of Object.entries(definitions)) {
		const cap = `${key.charAt(0).toUpperCase()}${key.slice(1)}`;
		const validate = validators[key];
		if (!validate) throw new Error(`Validator missing for queue "${String(key)}"`);

		context[`receiveFrom${cap}Queue`] = async (payload: unknown, metadata?: QueueTriggerMetadata) => {
			if (!validate(payload)) {
				throw new Error(`Invalid payload for queue "${def.queueName}": ${formatQueueValidationErrors(validate.errors)}`);
			}

			const message = {
				id: metadata?.id ?? '',
				...(metadata?.popReceipt === undefined ? {} : { popReceipt: metadata.popReceipt }),
				payload: payload,
				...(metadata?.dequeueCount === undefined ? {} : { dequeueCount: metadata.dequeueCount }),
			} as QueueMessage<MessagePayload<(typeof def)>>;

			if (service.isLoggingEnabled()) {
				const logger = service.getLogger();
				const resolvedMetadata = resolveLoggingFields(def.loggingMetadata, message.payload);
				const tags = resolveLoggingFields(def.loggingTags, message.payload);
				const mergedTags = { ...tags, queueName: def.queueName };
				const envelope: MessageLogEnvelope = {
					queue: def.queueName,
					direction: 'inbound',
					messageId: message.id,
					payload: message.payload,
					createdAt: new Date().toISOString(),
					...(resolvedMetadata === undefined ? {} : { metadata: resolvedMetadata }),
					tags: mergedTags,
				};
				const doLog = async () => {
					try {
						await logger?.logMessage(envelope);
					} catch (e) {
						diag.error('[QueueConsumer] logging failed', e);
					}
				};
				if (service.shouldAwaitLogging()) {
					await doLog();
				} else {
					void doLog();
				}
			}

			return message;
		};

		context[`peekAt${cap}Queue`] = (maxMessages?: number) => service.peekMessages(def.queueName, { maxMessages: maxMessages ?? 32 });
	}

	return context as QueueConsumerContext<I>;
}
