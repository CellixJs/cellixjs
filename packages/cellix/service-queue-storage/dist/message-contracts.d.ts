import type { ZodType } from 'zod';
export declare function defineQueueMessage<T>(schema: ZodType<T>): {
    encode(payload: T): string;
    decode(raw: string): T;
};
