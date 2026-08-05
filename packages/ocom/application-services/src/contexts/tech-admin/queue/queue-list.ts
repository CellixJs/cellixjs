import type { QueueStorageOperations } from '@ocom/service-queue-storage';

export interface TechAdminQueueMessage {
	id: string;
	popReceipt?: string;
	payload: unknown;
	dequeueCount?: number;
}

interface TechAdminQueueDefinition {
	name: string;
	peek: (queueStorageService: QueueStorageOperations, maxMessages?: number) => Promise<TechAdminQueueMessage[]>;
	getMessageCount: (queueStorageService: QueueStorageOperations) => Promise<number>;
}

export interface TechAdminQueue {
	name: string;
}

export const techAdminQueueDefinitions: readonly TechAdminQueueDefinition[] = [
	{
		name: 'community-creation',
		peek: (queueStorageService, maxMessages) => queueStorageService.peekAtCommunityCreationQueue(maxMessages),
		getMessageCount: (queueStorageService) => queueStorageService.getCommunityCreationQueueMessageCount(),
	},
	{
		name: 'community-creation-poison',
		peek: (queueStorageService, maxMessages) => queueStorageService.peekAtCommunityCreationPoisonQueue(maxMessages),
		getMessageCount: (queueStorageService) => queueStorageService.getCommunityCreationPoisonQueueMessageCount(),
	},
	{
		name: 'end-user-update',
		peek: (queueStorageService, maxMessages) => queueStorageService.peekAtEndUserUpdateQueue(maxMessages),
		getMessageCount: (queueStorageService) => queueStorageService.getEndUserUpdateQueueMessageCount(),
	},
	{
		name: 'end-user-update-poison',
		peek: (queueStorageService, maxMessages) => queueStorageService.peekAtEndUserUpdatePoisonQueue(maxMessages),
		getMessageCount: (queueStorageService) => queueStorageService.getEndUserUpdatePoisonQueueMessageCount(),
	},
];
