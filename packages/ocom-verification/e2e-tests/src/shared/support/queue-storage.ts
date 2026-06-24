import { ServiceQueueStorage, type CommunityCreationMessage } from '@ocom/service-queue-storage';

const communityCreationQueueName = 'community-creation';
let queueStorageService: ServiceQueueStorage | undefined;

type QueueMaintenanceOperations = {
	receiveMessages<T>(queue: string, opts?: { maxMessages?: number }): Promise<Array<{ id: string; popReceipt?: string; payload: T }>>;
	deleteMessage(queue: string, messageId: string, popReceipt: string): Promise<void>;
};

function getQueueConnectionString(): string | undefined {
	// biome-ignore lint/complexity/useLiteralKeys: process.env is typed as an index-signature map here
	return process.env['AZURE_STORAGE_CONNECTION_STRING'];
}

async function getQueueStorageService(): Promise<ServiceQueueStorage & QueueMaintenanceOperations> {
	if (queueStorageService) {
		return queueStorageService as ServiceQueueStorage & QueueMaintenanceOperations;
	}

	const connectionString = getQueueConnectionString();
	if (!connectionString) {
		throw new Error('AZURE_STORAGE_CONNECTION_STRING is not set for queue verification');
	}

	queueStorageService = new ServiceQueueStorage({ connectionString });
	await queueStorageService.startUp();
	return queueStorageService as ServiceQueueStorage & QueueMaintenanceOperations;
}

export async function stopQueueStorageService(): Promise<void> {
	if (!queueStorageService) {
		return;
	}
	await queueStorageService.shutDown();
	queueStorageService = undefined;
}

export async function clearKnownQueueMessages(): Promise<void> {
	if (!getQueueConnectionString()) {
		return;
	}

	const service = await getQueueStorageService();
	while (true) {
		const messages = await service.receiveMessages<CommunityCreationMessage>(communityCreationQueueName, { maxMessages: 32 });
		if (messages.length === 0) {
			return;
		}

		for (const message of messages) {
			if (!message.popReceipt) {
				throw new Error(`Cannot clear message "${message.id}" from "${communityCreationQueueName}" without a popReceipt`);
			}
			await service.deleteMessage(communityCreationQueueName, message.id, message.popReceipt);
		}
	}
}

export async function waitForCommunityCreationQueueMessage(expected: { communityId?: string | null; name: string; createdBy?: string }, timeoutMs = 5_000): Promise<CommunityCreationMessage> {
	const deadline = Date.now() + timeoutMs;
	const service = await getQueueStorageService();

	while (Date.now() < deadline) {
		const matchingMessage = (await service.peekAtCommunityCreationQueue(32)).find(
			(message) =>
				message.payload.name === expected.name &&
				(expected.createdBy === undefined || message.payload.createdBy === expected.createdBy) &&
				(expected.communityId == null || message.payload.communityId === expected.communityId),
		)?.payload;

		if (matchingMessage) {
			return matchingMessage;
		}

		await new Promise((resolve) => setTimeout(resolve, 100));
	}

	throw new Error(`Expected a matching message in "${communityCreationQueueName}" within ${timeoutMs}ms`);
}
