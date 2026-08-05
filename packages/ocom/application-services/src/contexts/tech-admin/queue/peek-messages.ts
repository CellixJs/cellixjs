import type { QueueStorageOperations } from '@ocom/service-queue-storage';
import { type TechAdminQueueMessage, techAdminQueueDefinitions } from './queue-list.ts';

export interface PeekQueueMessagesCommand {
	queueName: string;
	maxMessages?: number;
}

export function peekMessages(queueStorageService: QueueStorageOperations, checkPermission: () => Promise<void>): (command: PeekQueueMessagesCommand) => Promise<TechAdminQueueMessage[]> {
	return async ({ queueName, maxMessages }): Promise<TechAdminQueueMessage[]> => {
		await checkPermission();

		const queue = techAdminQueueDefinitions.find(({ name }) => name === queueName);
		if (!queue) throw new Error(`Queue "${queueName}" is not registered`);

		return await queue.peek(queueStorageService, maxMessages);
	};
}
