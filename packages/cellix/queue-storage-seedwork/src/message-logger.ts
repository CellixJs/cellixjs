/**
 * Queue Message Logger
 * 
 * Logs all queue messages (sent and received) to Azure Blob Storage
 * for audit, debugging, and compliance purposes.
 */

import { BlobServiceClient, type BlockBlobUploadOptions } from '@azure/storage-blob';
import { trace, type Tracer, SpanStatusCode } from '@opentelemetry/api';
import type { QueueMessageEnvelope, QueueDirection, BlobLoggingConfig } from './types.ts';

/**
 * Configuration for the message logger
 */
export interface MessageLoggerConfig {
	/**
	 * Azure Storage connection string
	 */
	connectionString: string;
	
	/**
	 * Name of the container for queue message logs
	 * @default 'queue-messages'
	 */
	containerName?: string;
}

/**
 * Logs queue messages to Azure Blob Storage
 */
export class MessageLogger {
	private readonly blobServiceClient: BlobServiceClient;
	private readonly containerName: string;
	private readonly tracer: Tracer;
	
	constructor(config: MessageLoggerConfig) {
		this.blobServiceClient = BlobServiceClient.fromConnectionString(config.connectionString);
		this.containerName = config.containerName ?? 'queue-messages';
		this.tracer = trace.getTracer('cellix:queue-storage:message-logger');
	}
	
	/**
	 * Logs a message to blob storage
	 * 
	 * @param message - The message envelope to log
	 * @param direction - Direction of the message (inbound/outbound)
	 * @param blobConfig - Optional blob logging configuration
	 * @returns Promise that resolves when logging is complete
	 */
	logMessage<TPayload = unknown>(
		message: QueueMessageEnvelope<TPayload>,
		direction: QueueDirection,
		blobConfig?: BlobLoggingConfig,
	): Promise<void> {
		return this.tracer.startActiveSpan('MessageLogger.logMessage', async (span) => {
			try {
				span.setAttribute('queue.name', message.queueName);
				span.setAttribute('queue.direction', direction);
				span.setAttribute('message.id', message.messageId);
				
				// Create container if it doesn't exist
				const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
				await containerClient.createIfNotExists();
				
				// Generate blob path: {direction}/{timestamp}.json
				const timestamp = new Date().toISOString();
				const blobName = `${direction}/${timestamp}.json`;
				const blockBlobClient = containerClient.getBlockBlobClient(blobName);
				
				// Prepare message content
				const messageJson = JSON.stringify(message, null, 2);
				
				// Prepare metadata (all values must be strings)
				const metadata: Record<string, string> = {
					queueName: message.queueName,
					direction,
					messageId: message.messageId,
					timestamp,
					...(blobConfig?.metadata ?? {}),
				};
				
				// Prepare tags (all values must be strings)
				const tags: Record<string, string> = {
					queueName: message.queueName,
					direction,
					...(blobConfig?.tags ?? {}),
				};
				
				// Upload options
				const uploadOptions: BlockBlobUploadOptions = {
					metadata,
					tags,
					blobHTTPHeaders: {
						blobContentType: 'application/json',
					},
				};
				
				// Upload the message
				await blockBlobClient.upload(messageJson, messageJson.length, uploadOptions);
				
				span.setStatus({ code: SpanStatusCode.OK });
			} catch (error) {
				span.setStatus({ code: SpanStatusCode.ERROR });
				if (error instanceof Error) {
					span.recordException(error);
					// Log the error but don't throw - we don't want logging failures to break the queue operation
					console.error('Failed to log message to blob storage:', error);
				}
			} finally {
				span.end();
			}
		});
	}
}
