/**
 * @ocom/service-queue-storage
 * 
 * Azure Queue Storage service for Owner Community application.
 * Provides typed queue senders and receivers with automatic blob logging.
 */

export { ServiceQueueStorage, type QueueStorage } from './service.ts';
export { CommunityCreatedQueueSender } from './senders.ts';
export { MemberQueueReceiver } from './receivers.ts';
export type {
	CommunityCreatedPayload,
	MemberUpdatePayload,
} from './queue-configs.ts';
