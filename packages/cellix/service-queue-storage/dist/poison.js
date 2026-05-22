/**
 * Move a single received message to a poison queue.
 * Order of operations:
 *  1) (optional) persist a message log via provided logger
 *  2) send the preserved envelope to the poison queue
 *  3) delete the original message from the source queue
 *
 * If sending to poison fails, the original message is NOT deleted so it can be retried.
 */
export async function moveMessageToPoison(service, sourceQueue, message, opts) {
    const poisonName = opts?.poisonQueueName ?? `${sourceQueue}-poison`;
    const envelope = {
        queue: sourceQueue,
        messageId: message.id ?? '',
        payload: message.payload,
        metadata: { dequeueCount: message.dequeueCount ?? 0 },
        createdAt: new Date().toISOString(),
    };
    // 1) log if logger provided
    if (opts?.logger) {
        const doLog = async () => {
            try {
                await opts.logger?.logMessage(envelope);
            }
            catch (e) {
                console.error('[moveMessageToPoison] logging failed', e);
            }
        };
        if (opts.awaitLogging)
            await doLog();
        else
            void doLog();
    }
    // 2) send to poison queue (preserve full envelope)
    try {
        await service.sendMessage(poisonName, envelope);
    }
    catch (e) {
        console.error('[moveMessageToPoison] send to poison failed', e);
        throw e; // let caller decide
    }
    // 3) delete original message (best-effort only after successful send)
    if (message.popReceipt && message.id) {
        try {
            await service.deleteMessage(sourceQueue, message.id, message.popReceipt);
        }
        catch (e) {
            console.error('[moveMessageToPoison] failed to delete original message', e);
        }
    }
}
export async function handleMessageWithRetries(service, queue, handler, opts) {
    const threshold = opts?.retryThreshold ?? 5;
    const poisonName = opts?.poisonQueueName ?? `${queue}-poison`;
    const messages = await service.receiveMessages(queue, { maxMessages: 1 });
    for (const m of messages) {
        try {
            await handler(m);
            if (m.popReceipt && m.id)
                await service.deleteMessage(queue, m.id, m.popReceipt);
        }
        catch (err) {
            const count = m.dequeueCount ?? 0;
            if (count >= threshold) {
                try {
                    const moveOpts = { poisonQueueName: poisonName, logger: opts?.logger, awaitLogging: opts?.awaitLogging };
                    await moveMessageToPoison(service, queue, m, moveOpts);
                }
                catch (e) {
                    console.error('[handleMessageWithRetries] failed moving to poison', e);
                }
            }
            else {
                throw err;
            }
        }
    }
}
//# sourceMappingURL=poison.js.map