import { registerQueues } from '@cellix/service-queue-storage';
import { endUserUpdateQueue } from './schemas/inbound/end-user-update.ts';
import { communityCreationQueue } from './schemas/outbound/community-creation.ts';

export const queueRegistry = registerQueues({
	outbound: {
		communityCreation: communityCreationQueue,
	},
	inbound: {
		endUserUpdate: endUserUpdateQueue,
	},
});

export type AppQueueProducerContext = typeof queueRegistry.producer;
export type AppQueueConsumerContext = typeof queueRegistry.consumer;

export const allQueueNames = [communityCreationQueue.queueName, endUserUpdateQueue.queueName];
