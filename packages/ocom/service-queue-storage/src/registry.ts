import { createRegisteredQueueService, registerQueues } from '@cellix/service-queue-storage';
import { communityUpdateQueue } from './schemas/inbound/community-update.ts';
import { endUserUpdateQueue } from './schemas/inbound/end-user-update.ts';
import { communityCreationQueue } from './schemas/outbound/community-creation.ts';

const outboundQueues = {
	communityCreation: communityCreationQueue,
};

const inboundQueues = {
	endUserUpdate: endUserUpdateQueue,
	communityUpdate: communityUpdateQueue,
};

const queues = registerQueues({
	outbound: outboundQueues,
	inbound: inboundQueues,
});

export const ServiceQueueStorage = createRegisteredQueueService(queues);
export type ServiceQueueStorage = InstanceType<typeof ServiceQueueStorage>;
