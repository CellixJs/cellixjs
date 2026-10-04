import { ServiceBlobStorage, ServiceClientBlobStorage } from '@ocom/service-blob-storage';
import { ServiceVideoWorkerQueueStorage } from '@ocom/service-queue-storage';
import { ServiceVideoEncoding } from '@ocom/service-video-encoding';
import type { WorkerConfig } from './config.ts';

const QUEUE_LOGGING = { enabled: true, container: 'queue-logs', await: false } as const;

interface WorkerServices {
	queue: ServiceVideoWorkerQueueStorage;
	encoder: ServiceVideoEncoding;
	/** Stops every started service, in reverse start order. */
	shutDown(): Promise<void>;
}

interface Lifecycle {
	startUp(): Promise<unknown>;
	shutDown(): Promise<void>;
}

/**
 * Creates and starts the worker's infrastructure services.
 *
 * With a connection string (local development against Azurite) blob and queue
 * access use it directly. Without one (Azure) they use the account name and
 * managed identity; a user-assigned identity is selected with `AZURE_CLIENT_ID`.
 * The encoder starts last, so a missing ffmpeg or shaka-packager fails startup
 * after storage is confirmed reachable. If any service fails to start, the
 * ones already started are shut down before the error is rethrown.
 */
export async function startWorkerServices(config: WorkerConfig): Promise<WorkerServices> {
	const { accountName, connectionString } = config.storage;
	const blobStorage = connectionString ? new ServiceClientBlobStorage({ accountName, signingConnectionString: connectionString }) : new ServiceBlobStorage({ accountName });
	const queue = connectionString ? new ServiceVideoWorkerQueueStorage({ connectionString }) : new ServiceVideoWorkerQueueStorage({ accountName });
	queue.enableLogging(blobStorage, QUEUE_LOGGING);
	const encoder = new ServiceVideoEncoding({ blobStorage, ...config.encoder });

	const started: Lifecycle[] = [];
	const shutDown = async () => {
		for (const service of started.reverse()) {
			await service.shutDown();
		}
	};

	try {
		for (const service of [blobStorage, queue, encoder] as Lifecycle[]) {
			await service.startUp();
			started.push(service);
		}
	} catch (error) {
		await shutDown();
		throw error;
	}

	return { queue, encoder, shutDown };
}
