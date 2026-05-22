import type { z } from 'zod';
import type { InboundQueueMap, PeekMessagesOptions, QueueMessage, ReceiveMessagesOptions } from './interfaces.js';
import type { PoisonQueueOptions } from './poison.js';
import type { ServiceQueueStorage } from './service-queue-storage.js';
type Capitalize<S extends string> = S extends `${infer F}${infer R}` ? `${Uppercase<F>}${R}` : S;
export type QueueConsumerContext<I extends InboundQueueMap> = {
    [K in keyof I as `receive${Capitalize<string & K>}`]: (opts?: ReceiveMessagesOptions) => Promise<QueueMessage<z.infer<I[K]['schema']>>[]>;
} & {
    [K in keyof I as `peek${Capitalize<string & K>}`]: (opts?: PeekMessagesOptions) => Promise<QueueMessage<z.infer<I[K]['schema']>>[]>;
} & {
    [K in keyof I as `delete${Capitalize<string & K>}`]: (messageId: string, popReceipt: string) => Promise<void>;
} & {
    [K in keyof I as `handle${Capitalize<string & K>}`]: (handler: (msg: QueueMessage<z.infer<I[K]['schema']>>) => Promise<void>, opts?: PoisonQueueOptions) => Promise<void>;
};
export declare function createQueueConsumer<I extends InboundQueueMap>(service: ServiceQueueStorage | Pick<ServiceQueueStorage, 'receiveMessages' | 'peekMessages' | 'deleteMessage'>, definitions: I): QueueConsumerContext<I>;
export {};
