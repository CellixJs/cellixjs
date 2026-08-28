import type { QueueStorageOperations } from '@ocom/service-queue-storage';

export interface SendQueueMessageCommand {
	queueName: string;
	payload: unknown;
	reason: string;
}

export function sendMessage(queueStorageService: Pick<QueueStorageOperations, 'sendMessageToRegisteredQueue'>, checkPermission: () => Promise<void>): (command: SendQueueMessageCommand) => Promise<void> {
	return async ({ queueName, payload, reason }): Promise<void> => {
		await checkPermission();
		if (!reason.trim()) {
			throw new Error('Reason is required');
		}
		await queueStorageService.sendMessageToRegisteredQueue(queueName, payload as object, {
			loggingTags: { source: 'TECH-ADMIN' },
			loggingMetadata: { reason },
		});
	};
}
