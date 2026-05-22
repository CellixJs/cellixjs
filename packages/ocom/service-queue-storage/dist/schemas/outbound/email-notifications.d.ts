import { z } from 'zod';
export declare const emailNotificationsQueue: {
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
export type EmailNotification = z.infer<typeof emailNotificationsQueue.schema>;
