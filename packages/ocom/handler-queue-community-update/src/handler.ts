import type { StorageQueueHandler } from '@azure/functions';
import type { ApplicationServicesFactory } from '@ocom/application-services';
import type { CommunityUpdatePayload, QueueStorageOperations } from '@ocom/service-queue-storage';

/**
 * Creates an Azure Functions Storage Queue handler for processing community update messages.
 *
 * @param applicationServicesFactory - Factory for building system-scoped application services
 * @param queueService - Queue storage operations for receiving and validating messages
 * @returns An Azure Functions StorageQueueHandler for the community-update queue
 *
 * @example
 * ```ts
 * import { communityUpdateQueueHandlerCreator } from '@ocom/handler-queue-community-update';
 *
 * Cellix
 *   .initializeInfrastructureServices(...)
 *   .setContext(...)
 *   .initializeApplicationServices(...)
 *   .registerAzureFunctionQueueHandler(
 *     'community-update',
 *     { queueName: 'community-update', connection: 'AzureWebJobsStorage' },
 *     (host, infra) => communityUpdateQueueHandlerCreator(host, infra.getInfrastructureService(ServiceQueueStorage)),
 *   )
 *   .startUp();
 * ```
 */
export const communityUpdateQueueHandlerCreator = (applicationServicesFactory: ApplicationServicesFactory, queueService: QueueStorageOperations): StorageQueueHandler<CommunityUpdatePayload> => {
	return async (queueEntry, context) => {
		// biome-ignore lint/complexity/useLiteralKeys: triggerMetadata uses an index signature type that requires bracket access
		const id = (context.triggerMetadata?.['id'] as string) ?? '';
		// biome-ignore lint/complexity/useLiteralKeys: triggerMetadata uses an index signature type that requires bracket access
		const popReceipt = context.triggerMetadata?.['popReceipt'] as string | undefined;
		// biome-ignore lint/complexity/useLiteralKeys: triggerMetadata uses an index signature type that requires bracket access
		const dequeueCount = context.triggerMetadata?.['dequeueCount'] as number | undefined;
		const metadata = {
			id,
			...(popReceipt === undefined ? {} : { popReceipt }),
			...(dequeueCount === undefined ? {} : { dequeueCount }),
		};
		let message: Awaited<ReturnType<typeof queueService.receiveFromCommunityUpdateQueue>>;
		try {
			message = await queueService.receiveFromCommunityUpdateQueue(queueEntry, metadata);
		} catch (err) {
			context.error(`community-update: invalid message payload: ${err instanceof Error ? err.message : String(err)}`);
			return;
		}
		const appServices = await applicationServicesFactory.forSystem();
		const { communityId, name, domain, whiteLabelDomain, handle } = message.payload;
		try {
			await appServices.Community.Community.updateSettings({
				id: communityId,
				...(name === undefined ? {} : { name }),
				...(domain === undefined ? {} : { domain }),
				...(whiteLabelDomain === undefined ? {} : { whiteLabelDomain }),
				...(handle === undefined ? {} : { handle }),
			});
		} catch (err) {
			if (err instanceof Error && err.message.toLowerCase().includes('community not found')) {
				context.error(`community-update: community not found: ${communityId}`);
				return;
			}
			throw err;
		}
	};
};
