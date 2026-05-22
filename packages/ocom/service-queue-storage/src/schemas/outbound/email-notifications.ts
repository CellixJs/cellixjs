import type { OutboundQueueSchema } from '@cellix/service-queue-storage';
import { z } from 'zod';

export const emailNotificationsQueue = {
	queueName: 'email-notifications',
	schema: z.object({
		to: z.string().email(),
		subject: z.string(),
		body: z.string(),
	}),
	loggingTags: { domain: 'notifications', type: 'email' },
} satisfies OutboundQueueSchema;

export type EmailNotification = z.infer<typeof emailNotificationsQueue.schema>;
