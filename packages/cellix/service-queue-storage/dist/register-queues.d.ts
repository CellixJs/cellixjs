import type { InboundQueueMap, OutboundQueueMap } from './interfaces.js';
import { type QueueConsumerContext } from './queue-consumer.js';
import { type QueueProducerContext } from './queue-producer.js';
import type { ServiceQueueStorage } from './service-queue-storage.js';
export declare function registerQueues<O extends OutboundQueueMap, I extends InboundQueueMap>(config: {
    outbound: O;
    inbound: I;
}): {
    readonly producer: QueueProducerContext<O>;
    readonly consumer: QueueConsumerContext<I>;
    readonly _bind: (service: ServiceQueueStorage) => {
        producer: QueueProducerContext<O>;
        consumer: QueueConsumerContext<I>;
    };
};
