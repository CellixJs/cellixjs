import { z } from 'zod';
// Example schemas — real application schemas would be domain-specific
export const EmailNotificationSchema = z.object({
    to: z.string().email(),
    subject: z.string(),
    body: z.string(),
});
export const AuditEventSchema = z.object({
    action: z.string(),
    userId: z.string(),
    timestamp: z.string().datetime(),
    metadata: z.record(z.string()).optional(),
});
export const outboundQueueDefinitions = {
    emailNotifications: {
        queueName: 'email-notifications',
        schema: EmailNotificationSchema,
        loggingTags: { domain: 'notifications', type: 'email' },
    },
    auditEvents: {
        queueName: 'audit-events',
        schema: AuditEventSchema,
        loggingTags: { domain: 'audit', type: 'event' },
    },
};
//# sourceMappingURL=queue-storage.contract.js.map