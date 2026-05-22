import type { OutboundQueueSchema } from '@cellix/service-queue-storage';
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
} satisfies OutboundQueueSchema;

export type AuditEvent = z.infer<typeof auditEventsQueue.schema>;
