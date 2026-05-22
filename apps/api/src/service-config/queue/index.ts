import { BlobQueueMessageLogger, ServiceQueueStorage } from '@cellix/service-queue-storage';
import type { ServiceBlobStorage } from '@ocom/service-blob-storage';
import { allQueueNames } from '@ocom/service-queue-storage';

const { AZURE_QUEUE_ACCOUNT_NAME: accountName, AZURE_QUEUE_CONNECTION_STRING: connectionString, QUEUE_LOG_CONTAINER: logContainer } = process.env;

if (!accountName) {
	throw new Error('Missing AZURE_QUEUE_ACCOUNT_NAME environment variable. Required for queue operations with managed identity authentication.');
}

if (!connectionString) {
	// Some applications may not require connection string; however for client operations we expect it
	throw new Error('Missing AZURE_QUEUE_CONNECTION_STRING environment variable. Required for connection-string-based queue operations.');
}

export function createQueueServices(clientOperationsService: ServiceBlobStorage, isProd: boolean) {
	const queueLoggingEnabled = !!logContainer;
	let queueLogger: BlobQueueMessageLogger | undefined;
	if (queueLoggingEnabled) {
		// BlobQueueMessageLogger expects an object with uploadText({ containerName, blobName, text })
		const blobLike = clientOperationsService as unknown as { uploadText(request: { containerName: string; blobName: string; text: string }): Promise<unknown> };
		queueLogger = new BlobQueueMessageLogger(blobLike, logContainer as string);
	}

	// Build the list of queues to auto-provision from the application's queue registry when available
	// This keeps configuration centralized in the OCOM queue registry
	const provisionQueues = Array.isArray(allQueueNames) && allQueueNames.length > 0 ? allQueueNames : ['email-notifications', 'audit-events', 'import-requests'];
	const qAccount = accountName as string | undefined;
	const qConnection = connectionString as string | undefined;

	const queueService = isProd
		? new ServiceQueueStorage({ accountName: qAccount as string, logging: { enabled: queueLoggingEnabled, container: logContainer as string }, logger: queueLogger, provisionQueues })
		: new ServiceQueueStorage({ connectionString: qConnection as string, localDev: !isProd, logging: { enabled: queueLoggingEnabled, container: logContainer as string }, logger: queueLogger, provisionQueues });

	return { queueService, queueLogger, provisionQueues };
}
