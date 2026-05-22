import { z } from 'zod';
export const emailNotificationsQueue = {
    queueName: 'email-notifications',
    schema: z.object({
        to: z.string().email(),
        subject: z.string(),
        body: z.string(),
    }),
    loggingTags: { domain: 'notifications', type: 'email' },
};
//# sourceMappingURL=email-notifications.js.map