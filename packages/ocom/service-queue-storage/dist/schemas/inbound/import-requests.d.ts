import { z } from 'zod';
export declare const importRequestsQueue: {
    queueName: string;
    schema: z.ZodObject<{
        importId: z.ZodString;
        requestedBy: z.ZodString;
        fileUrl: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        importId: string;
        requestedBy: string;
        fileUrl: string;
    }, {
        importId: string;
        requestedBy: string;
        fileUrl: string;
    }>;
    loggingTags: {
        domain: string;
        type: string;
    };
};
export type ImportRequest = z.infer<typeof importRequestsQueue.schema>;
