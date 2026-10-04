import { createRegisteredQueueService, registerQueues } from '@cellix/service-queue-storage';
import { endUserUpdateQueue } from './schemas/inbound/end-user-update.ts';
import { communityCreationQueue } from './schemas/outbound/community-creation.ts';
import { encodeVideoQueue } from './schemas/outbound/encode-video.ts';

const outboundQueues = {
	communityCreation: communityCreationQueue,
	encodeVideo: encodeVideoQueue,
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

const videoWorkerQueues = registerQueues({
	outbound: {},
	inbound: {
		encodeVideo: encodeVideoQueue,
	},
});

/**
 * Queue service for the video encoding worker. It registers only
 * `encode-video`, as an inbound queue processed with
 * `processNextFromEncodeVideoQueue`, so the worker carries no API queue methods.
 */
export const ServiceVideoWorkerQueueStorage = createRegisteredQueueService(videoWorkerQueues);
export type ServiceVideoWorkerQueueStorage = InstanceType<typeof ServiceVideoWorkerQueueStorage>;
