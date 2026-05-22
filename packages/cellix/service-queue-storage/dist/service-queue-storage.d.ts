import type { IQueueStorageOperations, PeekMessagesOptions, QueueMessage, QueueStorageConfig, ReceiveMessagesOptions, SendMessageOptions } from './interfaces.js';
export declare class ServiceQueueStorage implements IQueueStorageOperations {
    private options;
    private inferredMode;
    private queueServiceClient;
    private started;
    constructor(options: QueueStorageConfig);
    startUp(): Promise<IQueueStorageOperations>;
    shutDown(): Promise<void>;
    private getQueueClient;
    /**
     * Ensure a queue exists. Useful for localDev auto-provisioning.
     */
    createQueueIfNotExists(queue: string): Promise<void>;
    sendMessage<_T = unknown>(queue: string, message: string | object, opts?: SendMessageOptions): Promise<void>;
    sendValidatedMessage<T>(queue: string, contract: {
        encode(payload: T): string;
    }, payload: T, opts?: SendMessageOptions): Promise<void>;
    receiveMessages<_T = unknown>(queue: string, opts?: ReceiveMessagesOptions): Promise<QueueMessage<_T>[]>;
    deleteMessage(queue: string, messageId: string, popReceipt: string): Promise<void>;
    peekMessages<_T = unknown>(queue: string, opts?: PeekMessagesOptions): Promise<QueueMessage<_T>[]>;
}
