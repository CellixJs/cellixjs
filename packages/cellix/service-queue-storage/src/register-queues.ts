import type { InboundQueueMap, OutboundQueueMap, PeekMessagesOptions, ReceiveMessagesOptions } from './interfaces.js';
import { createQueueConsumer, type QueueConsumerContext } from './queue-consumer.js';
import { createQueueProducer, type QueueProducerContext } from './queue-producer.js';
import type { ServiceQueueStorage } from './service-queue-storage.js';

export function registerQueues<O extends OutboundQueueMap, I extends InboundQueueMap>(config: { outbound: O; inbound: I }) {
	// Create unbound stubs that match the typed shape but throw if used before binding
	const makeProducerStub = <T extends OutboundQueueMap>(defs: T): QueueProducerContext<T> => {
		const out: Record<string, unknown> = {};
		for (const key of Object.keys(defs)) {
			const methodName = `send${key.charAt(0).toUpperCase()}${key.slice(1)}`;
			out[methodName] = () => Promise.reject(new Error('Queue producer not bound to a ServiceQueueStorage'));
		}
		return out as QueueProducerContext<T>;
	};

	const makeConsumerStub = <T extends InboundQueueMap>(defs: T): QueueConsumerContext<T> => {
		const out: Record<string, unknown> = {};
		for (const key of Object.keys(defs)) {
			const cap = `${key.charAt(0).toUpperCase()}${key.slice(1)}`;
			out[`receive${cap}`] = (_opts?: ReceiveMessagesOptions) => Promise.resolve([]);
			out[`peek${cap}`] = (_opts?: PeekMessagesOptions) => Promise.resolve([]);
			out[`delete${cap}`] = (_messageId: string, _popReceipt: string) => Promise.resolve();
			out[`handle${cap}`] = (_handler: (msg: unknown) => Promise<void>, _opts?: ReceiveMessagesOptions) => Promise.resolve();
		}
		return out as QueueConsumerContext<T>;
	};

	const producer = makeProducerStub(config.outbound);
	const consumer = makeConsumerStub(config.inbound);

	return {
		producer,
		consumer,
		_bind(service: ServiceQueueStorage) {
			return {
				producer: createQueueProducer(service, config.outbound),
				consumer: createQueueConsumer(service, config.inbound),
			};
		},
	} as const;
}
