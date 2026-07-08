import type { StorageQueueHandler } from '@azure/functions';
import type { ApplicationServicesFactory } from '@ocom/application-services';
import { CommunityNotFoundError } from '@ocom/application-services';
import type { CommunityUpdatePayload, QueueStorageOperations } from '@ocom/service-queue-storage';
import { communityUpdateQueueName, extractQueueTriggerMetadata } from '@ocom/service-queue-storage';

/**
 * Creates an Azure Functions Storage Queue handler for processing community update messages.
 *
 * @param applicationServicesFactory - Factory for building system-scoped application services
 * @param queueService - Queue storage operations for receiving and validating messages
 * @returns An Azure Functions StorageQueueHandler for the community-update queue
 *```
 */
export const communityUpdateQueueHandlerCreator = (applicationServicesFactory: ApplicationServicesFactory, queueService: QueueStorageOperations): StorageQueueHandler<CommunityUpdatePayload> => {
	return async (queueEntry, context) => {
		const metadata = extractQueueTriggerMetadata(context.triggerMetadata);
		const { id, dequeueCount } = metadata;
		let message: Awaited<ReturnType<typeof queueService.receiveFromCommunityUpdateQueue>>;
		try {
			message = await queueService.receiveFromCommunityUpdateQueue(queueEntry, metadata);
		} catch (err) {
			context.error(`${communityUpdateQueueName}: invalid message payload (id=${id}, dequeueCount=${dequeueCount ?? 'unknown'}): ${err instanceof Error ? err.message : String(err)}`, err);
			return;
		}
		let appServices: Awaited<ReturnType<typeof applicationServicesFactory.forSystem>>;
		try {
			appServices = await applicationServicesFactory.forSystem({ canManageCommunitySettings: true });
		} catch (err) {
			context.error(`${communityUpdateQueueName}: failed to create application services (id=${id}, dequeueCount=${dequeueCount ?? 'unknown'}): ${err instanceof Error ? err.message : String(err)}`, err);
			throw err;
		}
		const { communityId, name, domain, whiteLabelDomain, handle } = message.payload.eventPayload;
		try {
			await appServices.Community.Community.updateSettings({
				id: communityId,
				...(name === undefined ? {} : { name }),
				...(domain === undefined ? {} : { domain }),
				...(whiteLabelDomain === undefined ? {} : { whiteLabelDomain }),
				...(handle === undefined ? {} : { handle }),
			});
		} catch (err) {
			if (err instanceof CommunityNotFoundError) {
				context.error(`${communityUpdateQueueName}: community not found: ${communityId} (id=${id}, dequeueCount=${dequeueCount ?? 'unknown'})`, err);
				return;
			}
			throw err;
		}
	};
};
