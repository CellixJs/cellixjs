import { BlobQueueMessageLogger, type IQueueMessageLogger, type QueueLoggingConfig, type QueueServiceLifecycle } from '@cellix/service-queue-storage';
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

export type ServiceQueueStorageOptions = { accountName: string } | { connectionString: string };

/**
 * Private implementation. Extends the framework's pre-bound Service class returned
 * by registerQueues, so all typed queue methods are already wired in the constructor
 * without any manual bind or Object.assign step.
 */
class ServiceQueueStorageImpl extends queueRegistry.Service {
	constructor(options: ServiceQueueStorageOptions) {
		if ('accountName' in options) {
			super({ accountName: options.accountName, provisionQueues: allQueueNames });
		} else {
			super({ connectionString: options.connectionString, provisionQueues: allQueueNames });
		}
	}

	public override enableLogging(blobStorage: BlobStorageLike): this;
	public override enableLogging(logger: IQueueMessageLogger, config?: QueueLoggingConfig): this;
	public override enableLogging(blobStorageOrLogger: BlobStorageLike | IQueueMessageLogger, config?: QueueLoggingConfig): this {
		if ('logMessage' in blobStorageOrLogger) {
			return super.enableLogging(blobStorageOrLogger, config);
		}
		return super.enableLogging(new BlobQueueMessageLogger(blobStorageOrLogger, QUEUE_LOG_CONTAINER), {
			enabled: true,
			container: QUEUE_LOG_CONTAINER,
			...config,
		});
	}
}

/**
 * Application-specific queue storage service type: lifecycle methods plus all
 * strongly-typed send, receive, and peek operations for every registered queue.
 */
export type ServiceQueueStorage = QueueServiceLifecycle &
	AppQueueProducerContext &
	AppQueueConsumerContext & {
		enableLogging(blobStorage: BlobStorageLike): ServiceQueueStorage;
	};

/**
 * Application-specific queue storage service.
 *
 * Extends the framework's registered queue service base class with all typed queue
 * methods for this application's registered queues. The queue bindings are applied
 * automatically in the constructor — no manual `_bind()` or `Object.assign` step is needed.
 *
 * Blob-based message logging is optional. Call `enableLogging(blobStorage)` after
 * construction when a backend blob storage service is available from the
 * infrastructure registry.
 *
 * Authentication follows the same mechanism as blob storage:
 * - `accountName`: uses DefaultAzureCredential (managed identity) in production
 * - `connectionString`: uses shared-key auth for local Azurite development
 *
 * @example
 * ```ts
 * const queueStorageService = isProd
 *   ? new ServiceQueueStorage({ accountName: BlobStorageConfig.accountName as string })
 *   : new ServiceQueueStorage({ connectionString: BlobStorageConfig.connectionString as string });
 * queueStorageService.enableLogging(blobStorageService);
 * serviceRegistry.registerInfrastructureService(queueStorageService);
 * // Retrieve later:
 * const svc = serviceRegistry.getInfrastructureService<ServiceQueueStorage>(ServiceQueueStorage);
 * await svc.sendMessageToCommunityCreationQueue({ communityId: '1', name: 'Test', createdBy: 'user1' });
 * ```
 */
export const ServiceQueueStorage = ServiceQueueStorageImpl;
