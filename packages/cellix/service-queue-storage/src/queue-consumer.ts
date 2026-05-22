import type { z } from 'zod';
import type { InboundQueueMap, QueueMessage } from './interfaces.js';
import type { ServiceQueueStorage } from './service-queue-storage.js';

type Capitalize<S extends string> = S extends `${infer F}${infer R}` ? `${Uppercase<F>}${R}` : S;

export type QueueConsumerContext<I extends InboundQueueMap> = {
	[K in keyof I as `receive${Capitalize<string & K>}`]: (maxMessages?: number) => Promise<QueueMessage<z.infer<I[K]['schema']>>[]>;
} & {
	[K in keyof I as `peek${Capitalize<string & K>}`]: (maxMessages?: number) => Promise<QueueMessage<z.infer<I[K]['schema']>>[]>;
};

export function createQueueConsumer<I extends InboundQueueMap>(service: ServiceQueueStorage | Pick<ServiceQueueStorage, 'receiveMessages' | 'peekMessages' | 'deleteMessage'>, definitions: I): QueueConsumerContext<I> {
	const context = {} as Record<string, unknown>;

	for (const [key, def] of Object.entries(definitions)) {
		const cap = `${key.charAt(0).toUpperCase()}${key.slice(1)}`;
		context[`receive${cap}`] = (maxMessages?: number) => service.receiveMessages(def.queueName, { maxMessages: maxMessages ?? 1 }).then((msgs) => msgs.map((m) => ({ ...m, payload: def.schema.parse(m.payload) })));
		context[`peek${cap}`] = (maxMessages?: number) => service.peekMessages(def.queueName, { maxMessages: maxMessages ?? 32 }).then((msgs) => msgs.map((m) => ({ ...m, payload: def.schema.parse(m.payload) })));
	}

	return context as QueueConsumerContext<I>;
}
