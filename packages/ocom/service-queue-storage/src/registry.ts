import { registerQueues } from '@cellix/service-queue-storage';
import type { QueueMessageLogBlobStorage, QueueServiceLifecycle } from '@cellix/service-queue-storage';
import { endUserUpdateQueue } from './schemas/inbound/end-user-update.ts';
import { communityCreationQueue } from './schemas/outbound/community-creation.ts';

export const QUEUE_LOG_CONTAINER = 'queue-logs';

const outboundQueues = {
	communityCreation: communityCreationQueue,
};

const inboundQueues = {
	endUserUpdate: endUserUpdateQueue,
};

export const queues: ReturnType<typeof registerQueues<typeof outboundQueues, typeof inboundQueues>> = registerQueues({
	outbound: outboundQueues,
	inbound: inboundQueues,
	serviceDefaults: {
		provisionQueues: [communityCreationQueue.queueName, endUserUpdateQueue.queueName],
		logging: {
			enabled: true,
			container: QUEUE_LOG_CONTAINER,
		},
	},
});

export type AppQueueProducerContext = typeof queues.producer;
export type AppQueueConsumerContext = typeof queues.consumer;
export type ServiceQueueStorageOptions = { accountName: string } | { connectionString: string };
export interface ServiceQueueStorage extends QueueServiceLifecycle, AppQueueProducerContext, AppQueueConsumerContext {
	enableLogging(blobStorage: QueueMessageLogBlobStorage): ServiceQueueStorage;
}
export const ServiceQueueStorage = queues.Service as unknown as new (options: ServiceQueueStorageOptions) => ServiceQueueStorage;

export const allQueueNames = [communityCreationQueue.queueName, endUserUpdateQueue.queueName];
