export type PoisonQueueOptions = {
    retryThreshold?: number;
    poisonQueueName?: string;
    awaitLogging?: boolean | undefined;
};
import type { QueueMessage } from './interfaces.js';
import type { IQueueMessageLogger } from './logging.js';
import type { ServiceQueueStorage } from './service-queue-storage.js';
/**
 * Move a single received message to a poison queue.
 * Order of operations:
 *  1) (optional) persist a message log via provided logger
 *  2) send the preserved envelope to the poison queue
 *  3) delete the original message from the source queue
 *
 * If sending to poison fails, the original message is NOT deleted so it can be retried.
 */
export declare function moveMessageToPoison<T>(service: ServiceQueueStorage, sourceQueue: string, message: QueueMessage<T>, opts?: {
    poisonQueueName?: string;
    logger?: IQueueMessageLogger | undefined;
    awaitLogging?: boolean | undefined;
}): Promise<void>;
export declare function handleMessageWithRetries<T>(service: ServiceQueueStorage, queue: string, handler: (msg: QueueMessage<T>) => Promise<void>, opts?: PoisonQueueOptions & {
    logger?: IQueueMessageLogger;
}): Promise<void>;
