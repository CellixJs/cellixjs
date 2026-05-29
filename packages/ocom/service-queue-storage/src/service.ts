import { BlobQueueMessageLogger, type QueueServiceLifecycle } from '@cellix/service-queue-storage';
import { type AppQueueConsumerContext, type AppQueueProducerContext, allQueueNames, queueRegistry } from './registry.ts';

export const QUEUE_LOG_CONTAINER = 'queue-logs';

/**
 * Structural type accepted for queue message logging.
 * Matches the public uploadText API of the framework ServiceBlobStorage without
 * requiring a direct package dependency on @cellix/service-blob-storage.
 */
type BlobStorageLike = {
	uploadText(request: { containerName: string; blobName: string; text: string; metadata?: Record<string, string>; tags?: Record<string, string> }): Promise<unknown>;
};

export type ServiceQueueStorageOptions = { accountName: string; blobStorage: BlobStorageLike } | { connectionString: string; blobStorage: BlobStorageLike };

/**
 * Private implementation. Extends the framework's pre-bound Service class returned
 * by registerQueues, so all typed queue methods are already wired in the constructor
 * without any manual bind or Object.assign step.
 */
class ServiceQueueStorageImpl extends queueRegistry.Service {
	constructor(options: ServiceQueueStorageOptions) {
		const logger = new BlobQueueMessageLogger(options.blobStorage, QUEUE_LOG_CONTAINER);
		if ('accountName' in options) {
			super({ accountName: options.accountName, logging: { enabled: true, container: QUEUE_LOG_CONTAINER }, logger, provisionQueues: allQueueNames });
		} else {
			super({ connectionString: options.connectionString, logging: { enabled: true, container: QUEUE_LOG_CONTAINER }, logger, provisionQueues: allQueueNames });
		}
	}
}

/**
 * Application-specific queue storage service type: lifecycle methods plus all
 * strongly-typed send, receive, and peek operations for every registered queue.
 */
export type ServiceQueueStorage = QueueServiceLifecycle & AppQueueProducerContext & AppQueueConsumerContext;

/**
 * Application-specific queue storage service.
 *
 * Extends the framework's registered queue service base class with all typed queue
 * methods for this application's registered queues. The queue bindings are applied
 * automatically in the constructor — no manual `_bind()` or `Object.assign` step is needed.
 *
 * Blob-based message logging is configured automatically using the supplied `blobStorage`
 * instance, which must be the backend SDK blob storage service (not the SAS-signing client).
 *
 * Authentication follows the same mechanism as blob storage:
 * - `accountName`: uses DefaultAzureCredential (managed identity) in production
 * - `connectionString`: uses shared-key auth for local Azurite development
 *
 * @example
 * ```ts
 * const queueStorageService = isProd
 *   ? new ServiceQueueStorage({ accountName: BlobStorageConfig.accountName as string, blobStorage: blobStorageService })
 *   : new ServiceQueueStorage({ connectionString: BlobStorageConfig.connectionString as string, blobStorage: blobStorageService });
 * serviceRegistry.registerInfrastructureService(queueStorageService);
 * // Retrieve later:
 * const svc = serviceRegistry.getInfrastructureService<ServiceQueueStorage>(ServiceQueueStorage);
 * await svc.sendMessageToCommunityCreationQueue({ communityId: '1', name: 'Test', createdBy: 'user1' });
 * ```
 */
export const ServiceQueueStorage = ServiceQueueStorageImpl;
