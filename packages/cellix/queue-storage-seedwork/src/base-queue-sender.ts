/**
 * Base Queue Sender
 * 
 * Abstract base class for sending messages to Azure Storage Queues
 * with automatic JSON encoding, schema validation, and blob logging.
 */

import { QueueClient } from '@azure/storage-queue';
import { trace, type Tracer, SpanStatusCode } from '@opentelemetry/api';
import { randomUUID } from 'node:crypto';
import type {
	QueueConfig,
	QueueMessageEnvelope,
	SendMessageResult,
} from './types.ts';
import type { MessageLogger } from './message-logger.ts';
import type { SchemaValidator } from './schema-validator.ts';

/**
 * Configuration for the queue sender
 */
export interface BaseQueueSenderConfig {
	/**
	 * Azure Storage connection string
	 */
	connectionString: string;
	
	/**
	 * Message logger for blob storage
	 */
	messageLogger: MessageLogger;
	
	/**
	 * Schema validator
	 */
	schemaValidator: SchemaValidator;
}

/**
 * Base class for sending messages to Azure Storage Queues
 * 
 * @typeParam TPayload - The type of the message payload
 */
export abstract class BaseQueueSender<TPayload = unknown> {
	protected readonly queueClient: QueueClient;
	protected readonly messageLogger: MessageLogger;
	protected readonly schemaValidator: SchemaValidator;
	protected readonly config: QueueConfig<TPayload>;
	protected readonly tracer: Tracer;
	
	constructor(
		baseConfig: BaseQueueSenderConfig,
		queueConfig: QueueConfig<TPayload>,
	) {
		this.queueClient = new QueueClient(
			baseConfig.connectionString,
			queueConfig.queueName,
		);
		this.messageLogger = baseConfig.messageLogger;
		this.schemaValidator = baseConfig.schemaValidator;
		this.config = queueConfig;
		this.tracer = trace.getTracer('cellix:queue-storage:sender');
		
		// Register schema
		this.schemaValidator.registerSchema(queueConfig.queueName, queueConfig.payloadSchema);
	}
	
	/**
	 * Ensures the queue exists
	 */
	async ensureQueue(): Promise<void> {
		await this.queueClient.createIfNotExists();
	}
	
	/**
	 * Sends a message to the queue
	 * 
	 * @param payload - The message payload to send
	 * @param correlationId - Optional correlation ID for tracing
	 * @param metadata - Optional custom metadata
	 * @returns Result of the send operation
	 */
	sendMessage(
		payload: TPayload,
		correlationId?: string,
		metadata?: Record<string, string>,
	): Promise<SendMessageResult> {
		return this.tracer.startActiveSpan('BaseQueueSender.sendMessage', async (span) => {
			try {
				span.setAttribute('queue.name', this.config.queueName);
				span.setAttribute('queue.direction', this.config.direction);
				
				// Validate payload
				const validatedPayload = this.schemaValidator.validate<TPayload>(
					this.config.queueName,
					payload,
				);
				
				// Create message envelope
				const messageId = randomUUID();
				const envelope: QueueMessageEnvelope<TPayload> = {
					messageId,
					timestamp: new Date().toISOString(),
					queueName: this.config.queueName,
					direction: this.config.direction,
					payload: validatedPayload,
				};
				
				if (correlationId !== undefined) {
					envelope.correlationId = correlationId;
				}
				if (metadata !== undefined) {
					envelope.metadata = metadata;
				}
				
				span.setAttribute('message.id', messageId);
				if (correlationId) {
					span.setAttribute('message.correlation_id', correlationId);
				}
				
				// Encode message as base64 JSON
				const messageText = Buffer.from(JSON.stringify(envelope)).toString('base64');
				
				// Send to queue
				const response = await this.queueClient.sendMessage(messageText);
				
				// Log to blob storage (don't await - fire and forget to avoid blocking)
				this.messageLogger.logMessage(envelope, this.config.direction, this.config.blobLogging)
					.catch((error) => {
						console.error('Failed to log outbound message to blob:', error);
					});
				
				span.setStatus({ code: SpanStatusCode.OK });
				
				return {
					messageId: response.messageId,
					insertionTime: response.insertedOn,
					expirationTime: response.expiresOn,
					popReceipt: response.popReceipt,
					nextVisibleTime: response.nextVisibleOn,
				};
			} catch (error) {
				span.setStatus({ code: SpanStatusCode.ERROR });
				if (error instanceof Error) {
					span.recordException(error);
				}
				throw error;
			} finally {
				span.end();
			}
		});
	}
}
