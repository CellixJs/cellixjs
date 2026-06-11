import type { InvocationContext, StorageQueueHandler } from '@azure/functions';
import type { ApplicationServicesFactory } from '@ocom/application-services';
import type { CommunityUpdateMessage, QueueStorageOperations } from '@ocom/service-queue-storage';

/**
 * Creates the Azure Functions queue handler for the `community-update` queue.
 *
 * @param applicationServicesFactory - Factory for resolving system-scoped application services.
 * @param queueStorageService - Application queue storage service with generated typed queue methods.
 * @returns A queue-trigger handler for `community-update` messages.
 */
export const communityUpdateQueueHandlerCreator = (applicationServicesFactory: ApplicationServicesFactory, queueStorageService: QueueStorageOperations): StorageQueueHandler<CommunityUpdateMessage> => {
	return async (message, invocationContext) => {
		const typedMessage = await queueStorageService.receiveFromCommunityUpdateQueue(buildTriggeredQueueMessage(message, invocationContext));

		if (!typedMessage) {
			throw new Error('Triggered queue message could not be resolved from queue storage service');
		}

		const { forSystem } = applicationServicesFactory;
		const applicationServices = forSystem ? await forSystem() : undefined;
		if (!applicationServices) {
			throw new Error('Application services factory does not support system-scoped queue handlers');
		}

		const existingCommunity = await applicationServices.Community.Community.queryById({ id: typedMessage.payload.communityId });
		if (!existingCommunity) {
			invocationContext.error(`Community not found for community-update queue message: ${typedMessage.payload.communityId}`);
			return;
		}

		await applicationServices.Community.Community.updateSettings({
			id: typedMessage.payload.communityId,
			...(typedMessage.payload.name !== undefined ? { name: typedMessage.payload.name } : {}),
			...(typedMessage.payload.domain !== undefined ? { domain: typedMessage.payload.domain } : {}),
			...(typedMessage.payload.whiteLabelDomain !== undefined ? { whiteLabelDomain: typedMessage.payload.whiteLabelDomain } : {}),
			...(typedMessage.payload.handle !== undefined ? { handle: typedMessage.payload.handle } : {}),
		});
	};
};

function buildTriggeredQueueMessage(message: CommunityUpdateMessage, invocationContext: InvocationContext) {
	const triggeredMessage: {
		payload: CommunityUpdateMessage;
		id?: string;
		popReceipt?: string;
		dequeueCount?: number;
	} = {
		payload: message,
	};

	const id = pickString(invocationContext, ['id', 'messageId']);
	if (id !== undefined) {
		triggeredMessage.id = id;
	}

	const popReceipt = pickString(invocationContext, ['popReceipt']);
	if (popReceipt !== undefined) {
		triggeredMessage.popReceipt = popReceipt;
	}

	const dequeueCount = pickNumber(invocationContext, ['dequeueCount']);
	if (dequeueCount !== undefined) {
		triggeredMessage.dequeueCount = dequeueCount;
	}

	return triggeredMessage;
}

function pickString(invocationContext: InvocationContext, keys: string[]): string | undefined {
	const metadata = invocationContext.triggerMetadata as Record<string, unknown> | undefined;
	if (!metadata) {
		return undefined;
	}

	for (const key of keys) {
		const value = metadata[key];
		if (typeof value === 'string') {
			return value;
		}
	}

	return undefined;
}

function pickNumber(invocationContext: InvocationContext, keys: string[]): number | undefined {
	const metadata = invocationContext.triggerMetadata as Record<string, unknown> | undefined;
	if (!metadata) {
		return undefined;
	}

	for (const key of keys) {
		const value = metadata[key];
		if (typeof value === 'number') {
			return value;
		}
	}

	return undefined;
}
