import { z } from 'zod';
export declare const auditEventsQueue: {
    queueName: string;
    schema: z.ZodObject<{
        action: z.ZodString;
        userId: z.ZodString;
        timestamp: z.ZodString;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        action: string;
        userId: string;
        timestamp: string;
        metadata?: Record<string, string> | undefined;
    }, {
        action: string;
        userId: string;
        timestamp: string;
        metadata?: Record<string, string> | undefined;
    }>;
    loggingTags: {
        domain: string;
        type: string;
    };
};
export type AuditEvent = z.infer<typeof auditEventsQueue.schema>;
