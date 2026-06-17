import { QueueServiceClient } from '@azure/storage-queue';

export interface CommunityCreationQueueMessage {
	communityId: string;
	name: string;
	createdBy: string;
}

const communityCreationQueueName = 'community-creation';

function getQueueConnectionString(): string | undefined {
	return process.env.AZURE_STORAGE_CONNECTION_STRING;
}

async function withAzuriteTlsBypass<T>(action: () => Promise<T>): Promise<T> {
	const previous = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
	process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

	try {
		return await action();
	} finally {
		if (previous === undefined) {
			delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
		} else {
			process.env.NODE_TLS_REJECT_UNAUTHORIZED = previous;
		}
	}
}

function getQueueServiceClient(): QueueServiceClient {
	const connectionString = getQueueConnectionString();
	if (!connectionString) {
		throw new Error('AZURE_STORAGE_CONNECTION_STRING is not set for queue verification');
	}
	return QueueServiceClient.fromConnectionString(connectionString);
}

async function getQueueClient(queueName: string) {
	const queueClient = getQueueServiceClient().getQueueClient(queueName);
	await queueClient.createIfNotExists();
	return queueClient;
}

export async function clearKnownQueueMessages(): Promise<void> {
	if (!getQueueConnectionString()) {
		return;
	}
	await withAzuriteTlsBypass(async () => {
		const queueClient = await getQueueClient(communityCreationQueueName);
		await queueClient.clearMessages();
	});
}

export async function waitForCommunityCreationQueueMessage(expected: { communityId?: string | null; name: string; createdBy?: string }, timeoutMs = 5_000): Promise<CommunityCreationQueueMessage> {
	const deadline = Date.now() + timeoutMs;

	while (Date.now() < deadline) {
		const response = await withAzuriteTlsBypass(async () => {
			const queueClient = await getQueueClient(communityCreationQueueName);
			return await queueClient.peekMessages({ numberOfMessages: 32 });
		});
		const matchingMessage = response.peekedMessageItems
			.map((message) => decodeQueueMessage<CommunityCreationQueueMessage>(message.messageText))
			.find(
				(message): message is CommunityCreationQueueMessage =>
					message !== undefined && message.name === expected.name && (expected.createdBy === undefined || message.createdBy === expected.createdBy) && (expected.communityId == null || message.communityId === expected.communityId),
			);

		if (matchingMessage) {
			return matchingMessage;
		}

		await new Promise((resolve) => setTimeout(resolve, 100));
	}

	throw new Error(`Expected a matching message in "${communityCreationQueueName}" within ${timeoutMs}ms`);
}

function decodeQueueMessage<T>(messageText: string): T | undefined {
	try {
		return JSON.parse(Buffer.from(messageText, 'base64').toString('utf-8')) as T;
	} catch {
		return undefined;
	}
}
