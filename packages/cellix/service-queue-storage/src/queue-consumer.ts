import type { ZodTypeAny, z } from 'zod';
import type { InboundQueueMap, PeekMessagesOptions, QueueMessage, ReceiveMessagesOptions } from './interfaces.js';
import type { PoisonQueueOptions } from './poison.js';
import { handleMessageWithRetries } from './poison.js';
import type { ServiceQueueStorage } from './service-queue-storage.js';

type Capitalize<S extends string> = S extends `${infer F}${infer R}` ? `${Uppercase<F>}${R}` : S;

export type QueueConsumerContext<I extends InboundQueueMap> = {
	[K in keyof I as `receive${Capitalize<string & K>}`]: (opts?: ReceiveMessagesOptions) => Promise<QueueMessage<z.infer<I[K]['schema']>>[]>;
} & {
	[K in keyof I as `peek${Capitalize<string & K>}`]: (opts?: PeekMessagesOptions) => Promise<QueueMessage<z.infer<I[K]['schema']>>[]>;
} & {
	[K in keyof I as `delete${Capitalize<string & K>}`]: (messageId: string, popReceipt: string) => Promise<void>;
} & {
	[K in keyof I as `handle${Capitalize<string & K>}`]: (handler: (msg: QueueMessage<z.infer<I[K]['schema']>>) => Promise<void>, opts?: PoisonQueueOptions) => Promise<void>;
};

export function createQueueConsumer<I extends InboundQueueMap>(service: ServiceQueueStorage | Pick<ServiceQueueStorage, 'receiveMessages' | 'peekMessages' | 'deleteMessage'>, definitions: I): QueueConsumerContext<I> {
	const context = {} as Record<string, unknown>;

	for (const [key, def] of Object.entries(definitions)) {
		const cap = `${key.charAt(0).toUpperCase()}${key.slice(1)}`;
		context[`receive${cap}`] = (opts?: ReceiveMessagesOptions) => service.receiveMessages(def.queueName, opts).then((msgs) => msgs.map((m) => ({ ...m, payload: def.schema.parse(m.payload) })));
		context[`peek${cap}`] = (opts?: PeekMessagesOptions) => service.peekMessages(def.queueName, opts).then((msgs) => msgs.map((m) => ({ ...m, payload: def.schema.parse(m.payload) })));
		context[`delete${cap}`] = (messageId: string, popReceipt: string) => service.deleteMessage(def.queueName, messageId, popReceipt);
		context[`handle${cap}`] = (handler: (msg: QueueMessage<z.infer<ZodTypeAny>>) => Promise<void>, opts?: PoisonQueueOptions) =>
			handleMessageWithRetries(service as ServiceQueueStorage, def.queueName, handler, opts ?? { retryThreshold: 5 });
	}

	return context as QueueConsumerContext<I>;
}
