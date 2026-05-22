import { registerQueues } from '@cellix/service-queue-storage';
import { importRequestsQueue } from './schemas/inbound/import-requests.js';
import { auditEventsQueue } from './schemas/outbound/audit-events.js';
import { emailNotificationsQueue } from './schemas/outbound/email-notifications.js';

export const queueRegistry = registerQueues({
	outbound: {
		emailNotifications: emailNotificationsQueue,
		auditEvents: auditEventsQueue,
	},
	inbound: {
		importRequests: importRequestsQueue,
	},
});

export type AppQueueProducerContext = typeof queueRegistry.producer;
export type AppQueueConsumerContext = typeof queueRegistry.consumer;
