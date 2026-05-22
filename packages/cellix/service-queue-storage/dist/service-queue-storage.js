import { DefaultAzureCredential } from '@azure/identity';
import { QueueServiceClient } from '@azure/storage-queue';
export class ServiceQueueStorage {
    options;
    inferredMode;
    queueServiceClient = undefined;
    started = false;
    constructor(options) {
        this.options = options;
        if (options.connectionString)
            this.inferredMode = 'sharedKey';
        else if (options.accountName)
            this.inferredMode = 'managedIdentity';
    }
    async startUp() {
        await Promise.resolve();
        if (this.started)
            return this;
        this.started = true;
        if (this.inferredMode === 'sharedKey') {
            this.queueServiceClient = QueueServiceClient.fromConnectionString(this.options.connectionString);
            console.info('[ServiceQueueStorage] started (sharedKey)');
            // Auto-provision queues in local dev / azurite scenarios when requested
            const conn = this.options.connectionString;
            const isAzuriteConnection = conn.includes('UseDevelopmentStorage=true') || conn.includes('127.0.0.1');
            if (this.options.localDev === true || isAzuriteConnection) {
                if (Array.isArray(this.options.provisionQueues)) {
                    for (const q of this.options.provisionQueues) {
                        try {
                            await this.createQueueIfNotExists(q);
                        }
                        catch (e) {
                            console.warn('[ServiceQueueStorage] failed to auto-provision queue', q, e);
                        }
                    }
                }
            }
            return this;
        }
        if (this.inferredMode === 'managedIdentity') {
            const accountName = this.options.accountName;
            const credential = new DefaultAzureCredential();
            const url = `https://${accountName}.queue.core.windows.net`;
            this.queueServiceClient = new QueueServiceClient(url, credential);
            console.info('[ServiceQueueStorage] started (managedIdentity)');
            return this;
        }
        throw new Error('Invalid ServiceQueueStorage configuration: provide connectionString or accountName');
    }
    shutDown() {
        if (!this.queueServiceClient)
            return Promise.resolve();
        this.queueServiceClient = undefined;
        this.started = false;
        return Promise.resolve();
    }
    getQueueClient(queue) {
        if (!this.queueServiceClient)
            throw new Error('ServiceQueueStorage is not started');
        return this.queueServiceClient.getQueueClient(queue);
    }
    /**
     * Ensure a queue exists. Useful for localDev auto-provisioning.
     */
    async createQueueIfNotExists(queue) {
        const q = this.getQueueClient(queue);
        // createIfNotExists is supported by Azure SDK QueueClient
        try {
            await q.createIfNotExists();
        }
        catch (e) {
            console.warn('[ServiceQueueStorage] createQueueIfNotExists failed for', queue, e);
        }
    }
    async sendMessage(queue, message, opts) {
        const queueClient = this.getQueueClient(queue);
        const body = typeof message === 'string' ? message : JSON.stringify(message);
        const encoded = Buffer.from(body).toString('base64');
        const res = await queueClient.sendMessage(encoded);
        // Logging: if configured and logger provided, record envelope
        if (this.options.logging?.enabled && this.options.logger) {
            const envelope = {
                queue,
                messageId: res?.messageId ?? '',
                payload: typeof message === 'string'
                    ? (() => {
                        try {
                            return JSON.parse(message);
                        }
                        catch {
                            return message;
                        }
                    })()
                    : message,
                metadata: opts?.loggingTags ? { loggingTags: opts.loggingTags } : {},
                createdAt: new Date().toISOString(),
            };
            const doLog = async () => {
                try {
                    await this.options.logger?.logMessage(envelope);
                }
                catch (e) {
                    console.error('[ServiceQueueStorage] logging failed', e);
                }
            };
            if (this.options.logging?.await)
                await doLog();
            else
                void doLog();
        }
    }
    async sendValidatedMessage(queue, contract, payload, opts) {
        const encoded = contract.encode(payload);
        await this.sendMessage(queue, encoded, opts);
    }
    async receiveMessages(queue, opts) {
        const queueClient = this.getQueueClient(queue);
        const receiveOpts = { numberOfMessages: opts?.maxMessages ?? 1 };
        if (typeof opts?.visibilityTimeout === 'number') {
            receiveOpts.visibilityTimeout = opts.visibilityTimeout;
        }
        const res = await queueClient.receiveMessages(receiveOpts);
        const messages = [];
        if (res.receivedMessageItems) {
            for (const m of res.receivedMessageItems) {
                let payload = m.messageText ?? '';
                try {
                    const decoded = Buffer.from(String(payload), 'base64').toString('utf-8');
                    payload = JSON.parse(decoded);
                }
                catch (_e) {
                    // non-JSON or decode issue - keep raw
                }
                messages.push({ id: m.messageId, popReceipt: m.popReceipt, payload: payload, dequeueCount: m.dequeueCount });
            }
        }
        return messages;
    }
    async deleteMessage(queue, messageId, popReceipt) {
        const q = this.getQueueClient(queue);
        await q.deleteMessage(messageId, popReceipt);
    }
    async peekMessages(queue, opts) {
        const q = this.getQueueClient(queue);
        const res = await q.peekMessages({ numberOfMessages: opts?.maxMessages ?? 32 });
        const out = [];
        if (res.peekedMessageItems) {
            for (const m of res.peekedMessageItems) {
                let payload = m.messageText ?? '';
                try {
                    const decoded = Buffer.from(String(payload), 'base64').toString('utf-8');
                    payload = JSON.parse(decoded);
                }
                catch (_e) {
                    // ignore
                }
                out.push({ id: m.messageId, payload: payload, dequeueCount: m.dequeueCount });
            }
        }
        return out;
    }
}
//# sourceMappingURL=service-queue-storage.js.map