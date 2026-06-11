import type { StorageQueueHandler } from '@azure/functions';
import type { ApplicationServicesFactory } from '@ocom/application-services';
import type { CommunityUpdateMessage, QueueStorageOperations } from '@ocom/service-queue-storage';
/**
 * Creates the Azure Functions queue handler for the `community-update` queue.
 *
 * @param applicationServicesFactory - Factory for resolving system-scoped application services.
 * @param queueStorageService - Application queue storage service with generated typed queue methods.
 * @returns A queue-trigger handler for `community-update` messages.
 */
export declare const communityUpdateQueueHandlerCreator: (applicationServicesFactory: ApplicationServicesFactory, queueStorageService: QueueStorageOperations) => StorageQueueHandler<CommunityUpdateMessage>;
