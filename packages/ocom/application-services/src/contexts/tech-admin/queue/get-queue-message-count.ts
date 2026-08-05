import type { QueueStorageOperations } from '@ocom/service-queue-storage';
import { techAdminQueueDefinitions } from './queue-list.ts';

export interface TechAdminQueueMessageCount {
	value?: number;
	errorMessage?: string;
}

export interface GetQueueMessageCountCommand {
	queueName: string;
}

export function getQueueMessageCount(queueStorageService: QueueStorageOperations, checkPermission: () => Promise<void>): (command: GetQueueMessageCountCommand) => Promise<TechAdminQueueMessageCount> {
	return async ({ queueName }): Promise<TechAdminQueueMessageCount> => {
		await checkPermission();

		const queue = techAdminQueueDefinitions.find(({ name }) => name === queueName);
		if (!queue) return { errorMessage: `Queue "${queueName}" is not registered` };

		try {
			return { value: await queue.getMessageCount(queueStorageService) };
		} catch (error) {
			return { errorMessage: error instanceof Error ? error.message : String(error) };
		}
	};
}
