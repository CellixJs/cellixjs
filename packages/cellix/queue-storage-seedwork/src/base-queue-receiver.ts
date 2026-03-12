/**
 * Base Queue Receiver
 * 
 * Abstract base class for receiving messages from Azure Storage Queues
 * with automatic JSON decoding, schema validation, and blob logging.
 */

import { QueueClient } from '@azure/storage-queue';
import { trace, type Tracer, SpanStatusCode } from '@opentelemetry/api';
import type {
	QueueConfig,
	QueueMessageEnvelope,
	ReceiveMessageResult,
	ReceiveMessageOptions,
} from './types.ts';
import type { MessageLogger } from './message-logger.ts';
import type { SchemaValidator } from './schema-validator.ts';

/**
 * Configuration for the queue receiver
 */
export interface BaseQueueReceiverConfig {
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
 * Base class for receiving messages from Azure Storage Queues
 * 
 * @typeParam TPayload - The type of the message payload
 */
export abstract class BaseQueueReceiver<TPayload = unknown> {
	protected readonly queueClient: QueueClient;
	protected readonly messageLogger: MessageLogger;
	protected readonly schemaValidator: SchemaValidator;
	protected readonly config: QueueConfig<TPayload>;
	protected readonly tracer: Tracer;
	
	constructor(
		baseConfig: BaseQueueReceiverConfig,
		queueConfig: QueueConfig<TPayload>,
	) {
		this.queueClient = new QueueClient(
			baseConfig.connectionString,
			queueConfig.queueName,
		);
		this.messageLogger = baseConfig.messageLogger;
		this.schemaValidator = baseConfig.schemaValidator;
		this.config = queueConfig;
		this.tracer = trace.getTracer('cellix:queue-storage:receiver');
		
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
	 * Receives messages from the queue
	 * 
	 * @param options - Options for receiving messages
	 * @returns Array of received messages
	 */
	receiveMessages(
		options?: ReceiveMessageOptions,
	): Promise<ReceiveMessageResult<TPayload>[]> {
		return this.tracer.startActiveSpan('BaseQueueReceiver.receiveMessages', async (span) => {
			try {
				span.setAttribute('queue.name', this.config.queueName);
				span.setAttribute('queue.direction', this.config.direction);
				
				const maxMessages = options?.maxMessages ?? 1;
				const visibilityTimeout = options?.visibilityTimeout ?? 30;
				
				span.setAttribute('receive.max_messages', maxMessages);
				span.setAttribute('receive.visibility_timeout', visibilityTimeout);
				
				// Receive messages from queue
				const response = await this.queueClient.receiveMessages({
					numberOfMessages: maxMessages,
					visibilityTimeout,
				});
				
				const results: ReceiveMessageResult<TPayload>[] = [];
				
				// Process each received message
				for (const queueMessage of response.receivedMessageItems) {
					try {
						// Decode base64 message
						const messageText = Buffer.from(queueMessage.messageText, 'base64').toString('utf-8');
						const envelope = JSON.parse(messageText) as QueueMessageEnvelope<unknown>;
						
						// Validate payload
						const validatedPayload = this.schemaValidator.validate<TPayload>(
							this.config.queueName,
							envelope.payload,
						);
						
						// Create typed envelope
						const typedEnvelope: QueueMessageEnvelope<TPayload> = {
							...envelope,
							payload: validatedPayload,
						};
						
						// Log to blob storage (don't await - fire and forget)
						this.messageLogger.logMessage(typedEnvelope, this.config.direction, this.config.blobLogging)
							.catch((error) => {
								console.error('Failed to log inbound message to blob:', error);
							});
						
						results.push({
							message: typedEnvelope,
							messageId: queueMessage.messageId,
							popReceipt: queueMessage.popReceipt,
							dequeueCount: queueMessage.dequeueCount,
						});
					} catch (error) {
						// Log validation errors but continue processing other messages
						console.error('Failed to process message:', error);
						span.recordException(error instanceof Error ? error : new Error(String(error)));
					}
				}
				
				span.setAttribute('receive.messages_count', results.length);
				span.setStatus({ code: SpanStatusCode.OK });
				
				return results;
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
	
	/**
	 * Deletes a message from the queue
	 * 
	 * @param messageId - ID of the message to delete
	 * @param popReceipt - Pop receipt from the receive operation
	 */
	deleteMessage(messageId: string, popReceipt: string): Promise<void> {
		return this.tracer.startActiveSpan('BaseQueueReceiver.deleteMessage', async (span) => {
			try {
				span.setAttribute('queue.name', this.config.queueName);
				span.setAttribute('message.id', messageId);
				
				await this.queueClient.deleteMessage(messageId, popReceipt);
				
				span.setStatus({ code: SpanStatusCode.OK });
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
	
	/**
	 * Updates the visibility timeout of a message
	 * 
	 * @param messageId - ID of the message to update
	 * @param popReceipt - Pop receipt from the receive operation
	 * @param visibilityTimeout - New visibility timeout in seconds
	 * @returns Updated pop receipt
	 */
	updateMessageVisibility(
		messageId: string,
		popReceipt: string,
		visibilityTimeout: number,
	): Promise<string> {
		return this.tracer.startActiveSpan('BaseQueueReceiver.updateMessageVisibility', async (span) => {
			try {
				span.setAttribute('queue.name', this.config.queueName);
				span.setAttribute('message.id', messageId);
				span.setAttribute('visibility_timeout', visibilityTimeout);
				
				const response = await this.queueClient.updateMessage(
					messageId,
					popReceipt,
					undefined,
					visibilityTimeout,
				);
				
				span.setStatus({ code: SpanStatusCode.OK });
				
				return response.popReceipt ?? '';
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
