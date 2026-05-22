import { z } from 'zod';
export declare const EmailNotificationSchema: z.ZodObject<{
    to: z.ZodString;
    subject: z.ZodString;
    body: z.ZodString;
}, "strip", z.ZodTypeAny, {
    to: string;
    subject: string;
    body: string;
}, {
    to: string;
    subject: string;
    body: string;
}>;
export declare const AuditEventSchema: z.ZodObject<{
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
export declare const outboundQueueDefinitions: {
    emailNotifications: {
        queueName: string;
        schema: z.ZodObject<{
            to: z.ZodString;
            subject: z.ZodString;
            body: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            to: string;
            subject: string;
            body: string;
        }, {
            to: string;
            subject: string;
            body: string;
        }>;
        loggingTags: {
            domain: string;
            type: string;
        };
    };
    auditEvents: {
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
};
