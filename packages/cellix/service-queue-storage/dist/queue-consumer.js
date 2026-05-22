import { handleMessageWithRetries } from './poison.js';
export function createQueueConsumer(service, definitions) {
    const context = {};
    for (const [key, def] of Object.entries(definitions)) {
        const cap = `${key.charAt(0).toUpperCase()}${key.slice(1)}`;
        context[`receive${cap}`] = (opts) => service.receiveMessages(def.queueName, opts).then((msgs) => msgs.map((m) => ({ ...m, payload: def.schema.parse(m.payload) })));
        context[`peek${cap}`] = (opts) => service.peekMessages(def.queueName, opts).then((msgs) => msgs.map((m) => ({ ...m, payload: def.schema.parse(m.payload) })));
        context[`delete${cap}`] = (messageId, popReceipt) => service.deleteMessage(def.queueName, messageId, popReceipt);
        context[`handle${cap}`] = (handler, opts) => handleMessageWithRetries(service, def.queueName, handler, opts ?? { retryThreshold: 5 });
    }
    return context;
}
//# sourceMappingURL=queue-consumer.js.map