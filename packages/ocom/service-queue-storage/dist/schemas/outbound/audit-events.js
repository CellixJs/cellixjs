import { z } from 'zod';
export const auditEventsQueue = {
    queueName: 'audit-events',
    schema: z.object({
        action: z.string(),
        userId: z.string(),
        timestamp: z.string(),
        metadata: z.record(z.string()).optional(),
    }),
    loggingTags: { domain: 'audit', type: 'event' },
};
//# sourceMappingURL=audit-events.js.map