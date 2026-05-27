import type { MessagePayload, QueueMap } from './interfaces.js';
import { resolveLoggingFields } from './interfaces.js';
import type { IQueueMessageLogger, MessageLogEnvelope } from './logging.js';
import type { InternalQueueTransport } from './service-queue-storage.js';

type Capitalize<S extends string> = S extends `${infer F}${infer R}` ? `${Uppercase<F>}${R}` : S;

export type QueueConsumerContext<I extends QueueMap> = {
	[K in keyof I as `receiveFrom${Capitalize<string & K>}Queue`]: () => Promise<QueueMessage<MessagePayload<I[K]>> | undefined>;
} & {
	[K in keyof I as `peekAt${Capitalize<string & K>}Queue`]: (maxMessages?: number) => Promise<QueueMessage<MessagePayload<I[K]>>[]>;
};

type QueueMessage<T> = { id: string; popReceipt?: string; payload: T; dequeueCount?: number };

export function createQueueConsumer<I extends QueueMap>(
	service: Pick<InternalQueueTransport, 'receiveMessages' | 'peekMessages' | 'deleteMessage'>,
	definitions: I,
	validators: Record<string, (d: unknown) => boolean>,
	logger?: IQueueMessageLogger,
): QueueConsumerContext<I> {
	const context = {} as Record<string, unknown>;

	for (const [key, def] of Object.entries(definitions)) {
		const cap = `${key.charAt(0).toUpperCase()}${key.slice(1)}`;
		const validate = validators[key];
		if (!validate) throw new Error(`Validator missing for queue "${String(key)}"`);

		context[`receiveFrom${cap}Queue`] = () =>
			service.receiveMessages(def.queueName, { maxMessages: 1 }).then((msgs) => {
				const [m] = msgs;
				if (!m) return undefined;
				if (!validate(m.payload)) {
					throw new Error(`Invalid payload for queue "${def.queueName}": validation failed`);
				}
				if (logger) {
					const metadata = resolveLoggingFields(def.loggingMetadata, m.payload);
					const tags = resolveLoggingFields(def.loggingTags, m.payload);
					const mergedTags = { ...(tags ?? {}), queueName: def.queueName };
					const envelope: MessageLogEnvelope = {
						queue: def.queueName,
						direction: 'inbound',
						messageId: m.id,
						payload: m.payload,
						createdAt: new Date().toISOString(),
						...(metadata !== undefined ? { metadata } : {}),
						tags: mergedTags,
					};
					void logger.logMessage(envelope).catch((e) => console.error('[QueueConsumer] logging failed', e));
				}
				return m;
			});

		context[`peekAt${cap}Queue`] = (maxMessages?: number) =>
			service.peekMessages(def.queueName, { maxMessages: maxMessages ?? 32 }).then((msgs) =>
				msgs.map((m) => {
					if (!validate(m.payload)) {
						throw new Error(`Invalid payload for queue "${def.queueName}": validation failed`);
					}
					return m;
				}),
			);
	}

	return context as unknown as QueueConsumerContext<I>;
}
