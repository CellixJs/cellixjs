import type { ZodTypeAny, z } from 'zod';
import type { ServiceQueueStorage } from './service-queue-storage.js';
export type QueueDefinition<S extends ZodTypeAny> = {
    queueName: string;
    schema: S;
    loggingTags?: Record<string, string>;
};
export type QueueDefinitions = Record<string, QueueDefinition<ZodTypeAny>>;
export type QueueProducerContext<Q extends QueueDefinitions> = {
    [K in keyof Q as `send${Capitalize<string & K>}`]: (payload: z.infer<Q[K]['schema']>) => Promise<void>;
};
export declare function createQueueProducer<Q extends QueueDefinitions>(service: Pick<ServiceQueueStorage, 'sendMessage'>, definitions: Q): QueueProducerContext<Q>;
