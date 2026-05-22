import { createQueueConsumer } from './queue-consumer.js';
import { createQueueProducer } from './queue-producer.js';
export function registerQueues(config) {
    // Create unbound stubs that match the typed shape but throw if used before binding
    const makeProducerStub = (defs) => {
        const out = {};
        for (const key of Object.keys(defs)) {
            const methodName = `send${key.charAt(0).toUpperCase()}${key.slice(1)}`;
            out[methodName] = () => Promise.reject(new Error('Queue producer not bound to a ServiceQueueStorage'));
        }
        return out;
    };
    const makeConsumerStub = (defs) => {
        const out = {};
        for (const key of Object.keys(defs)) {
            const cap = `${key.charAt(0).toUpperCase()}${key.slice(1)}`;
            out[`receive${cap}`] = (_opts) => Promise.resolve([]);
            out[`peek${cap}`] = (_opts) => Promise.resolve([]);
            out[`delete${cap}`] = (_messageId, _popReceipt) => Promise.resolve();
            out[`handle${cap}`] = (_handler, _opts) => Promise.resolve();
        }
        return out;
    };
    const producer = makeProducerStub(config.outbound);
    const consumer = makeConsumerStub(config.inbound);
    return {
        producer,
        consumer,
        _bind(service) {
            return {
                producer: createQueueProducer(service, config.outbound),
                consumer: createQueueConsumer(service, config.inbound),
            };
        },
    };
}
//# sourceMappingURL=register-queues.js.map