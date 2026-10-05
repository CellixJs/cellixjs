import { createRegisteredQueueService, registerQueues } from '@cellix/service-queue-storage';
import { endUserUpdateQueue } from './schemas/inbound/end-user-update.ts';
import { communityCreationQueue } from './schemas/outbound/community-creation.ts';

const outboundQueues = {
	communityCreation: communityCreationQueue,
};

const inboundQueues = {
	endUserUpdate: endUserUpdateQueue,
};

const queues = registerQueues({
	outbound: outboundQueues,
	inbound: inboundQueues,
});

export const ServiceQueueStorage = createRegisteredQueueService(queues);
export type ServiceQueueStorage = InstanceType<typeof ServiceQueueStorage>;
