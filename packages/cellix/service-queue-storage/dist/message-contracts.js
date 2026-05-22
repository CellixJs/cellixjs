export function defineQueueMessage(schema) {
    return {
        encode(payload) {
            schema.parse(payload);
            return JSON.stringify(payload);
        },
        decode(raw) {
            const parsed = JSON.parse(raw);
            return schema.parse(parsed);
        },
    };
}
//# sourceMappingURL=message-contracts.js.map