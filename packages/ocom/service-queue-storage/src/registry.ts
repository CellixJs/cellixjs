import { registerQueues } from '@cellix/service-queue-storage';
import { importRequestsQueue } from './schemas/inbound/import-requests.js';
import { auditEventsQueue } from './schemas/outbound/audit-events.js';
import { communityCreationQueue } from './schemas/outbound/community-creation.js';
import { emailNotificationsQueue } from './schemas/outbound/email-notifications.js';

const outboundDefs = {
	emailNotifications: emailNotificationsQueue,
	auditEvents: auditEventsQueue,
	communityCreation: communityCreationQueue,
};

const inboundDefs = {
	importRequests: importRequestsQueue,
};

export const queueRegistry = registerQueues({
	outbound: outboundDefs,
	inbound: inboundDefs,
});

export const allQueueNames = [...Object.values(outboundDefs).map((d) => d.queueName), ...Object.values(inboundDefs).map((d) => d.queueName)];

export type AppQueueProducerContext = typeof queueRegistry.producer;
export type AppQueueConsumerContext = typeof queueRegistry.consumer;
