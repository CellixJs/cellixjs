import type { DataSources } from '@ocom/persistence';
import type { QueueStorageOperations } from '@ocom/service-queue-storage';

interface TechAdminQueueMessage {
	id: string;
	popReceipt?: string;
	payload: unknown;
	dequeueCount?: number;
}

interface QueueOperations {
	send?: (payload: unknown) => Promise<void>;
	peek: (maxMessages?: number) => Promise<TechAdminQueueMessage[]>;
}

type QueueStorageWithRawPeek = QueueStorageOperations & {
	peekMessages: (queueName: string, options?: { maxMessages?: number }) => Promise<TechAdminQueueMessage[]>;
};

export function registeredQueueOperations(queueStorageService: QueueStorageOperations): Map<string, QueueOperations> {
	const queueStorageWithRawPeek = queueStorageService as QueueStorageWithRawPeek;
	const primaryQueueOperations: [string, QueueOperations][] = [
		[
			'community-creation',
			{
				send: (payload) => queueStorageService.sendMessageToCommunityCreationQueue(payload as Parameters<typeof queueStorageService.sendMessageToCommunityCreationQueue>[0]),
				peek: (maxMessages) => queueStorageService.peekAtCommunityCreationQueue(maxMessages),
			},
		],
		[
			'end-user-update',
			{
				peek: (maxMessages) => queueStorageService.peekAtEndUserUpdateQueue(maxMessages),
			},
		],
	];

	return new Map([
		...primaryQueueOperations,
		...primaryQueueOperations.map(
			([queueName]) =>
				[
					`${queueName}-poison`,
					{
						peek: (maxMessages?: number) => queueStorageWithRawPeek.peekMessages(`${queueName}-poison`, maxMessages === undefined ? undefined : { maxMessages }),
					},
				] as [string, QueueOperations],
		),
	]);
}

export function ensureCanViewQueues(dataSources: DataSources, staffUserExternalId: string | undefined): () => Promise<void> {
	return async (): Promise<void> => {
		if (!staffUserExternalId) {
			throw new Error('Unauthorized to view queues');
		}

		const staffUser = await dataSources.readonlyDataSource.User.StaffUser.StaffUserReadRepo.getByExternalId(staffUserExternalId);
		if (!staffUser?.role?.permissions.techAdminPermissions.canViewQueues) {
			throw new Error('Unauthorized to view queues');
		}
	};
}
