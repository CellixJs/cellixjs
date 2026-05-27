import type { MessagePayload, QueueMap, QueueMessage } from './interfaces.js';
import { resolveLoggingFields } from './interfaces.js';
import type { InternalQueueTransport } from './internal-queue-storage-service.js';

type Capitalize<S extends string> = S extends `${infer F}${infer R}` ? `${Uppercase<F>}${R}` : S;

/** Public producer methods generated for an application's outbound queues. */
export type QueueProducerContext<O extends QueueMap> = {
	[K in keyof O as `sendMessageTo${Capitalize<string & K>}Queue`]: (payload: MessagePayload<O[K]>) => Promise<void>;
} & {
	[K in keyof O as `peekAt${Capitalize<string & K>}Queue`]: (maxMessages?: number) => Promise<QueueMessage<MessagePayload<O[K]>>[]>;
};

export function createQueueProducer<O extends QueueMap>(service: Pick<InternalQueueTransport, 'sendMessage' | 'peekMessages'>, definitions: O, validators: Record<string, (d: unknown) => boolean>): QueueProducerContext<O> {
	const context = {} as Record<string, unknown>;

	for (const [key, def] of Object.entries(definitions)) {
		const cap = `${key.charAt(0).toUpperCase()}${key.slice(1)}`;
		const validate = validators[key];
		if (!validate) throw new Error(`Validator missing for queue "${String(key)}"`);

		context[`sendMessageTo${cap}Queue`] = async (payload: unknown) => {
			if (!validate(payload)) {
				throw new Error(`Invalid payload for queue "${def.queueName}": validation failed`);
			}
			const tags = resolveLoggingFields(def.loggingTags, payload);
			const metadata = resolveLoggingFields(def.loggingMetadata, payload);
			const opts = {
				loggingDirection: 'outbound' as const,
				...(tags !== undefined ? { loggingTags: tags } : {}),
				...(metadata !== undefined ? { loggingMetadata: metadata } : {}),
			};
			await service.sendMessage(def.queueName, payload as object, opts);
		};

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

	return context as unknown as QueueProducerContext<O>;
}
