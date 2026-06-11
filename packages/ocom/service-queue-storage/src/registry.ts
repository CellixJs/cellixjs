import { registerQueues } from '@cellix/service-queue-storage';
import { endUserUpdateQueue } from './schemas/inbound/end-user-update.ts';
import { communityCreationQueue } from './schemas/outbound/community-creation.ts';

const outboundQueues = {
	communityCreation: communityCreationQueue,
};

const inboundQueues = {
	endUserUpdate: endUserUpdateQueue,
};

export const queueRegistry: ReturnType<typeof registerQueues<typeof outboundQueues, typeof inboundQueues>> = registerQueues({
	outbound: outboundQueues,
	inbound: inboundQueues,
});

export type AppQueueProducerContext = typeof queueRegistry.producer;
export type AppQueueConsumerContext = typeof queueRegistry.consumer;

export const allQueueNames = [communityCreationQueue.queueName, endUserUpdateQueue.queueName];
