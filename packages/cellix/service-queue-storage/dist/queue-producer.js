export function createQueueProducer(service, definitions) {
    const context = {};
    for (const [key, def] of Object.entries(definitions)) {
        const methodName = `send${key.charAt(0).toUpperCase()}${key.slice(1)}`;
        context[methodName] = async (payload) => {
            // Validate using the zod schema from the definition
            const validated = def.schema.parse(payload);
            // Delegate to the framework service for delivery + logging
            const opts = def.loggingTags ? { loggingTags: def.loggingTags } : undefined;
            await service.sendMessage(def.queueName, validated, opts);
        };
    }
    return context;
}
//# sourceMappingURL=queue-producer.js.map