/**
 * Queue Storage Seedwork - Type Definitions
 * 
 * This module defines the core types for Azure Queue Storage integration,
 * including message envelopes, payloads, metadata, and configuration.
 */

import type { JSONSchemaType } from 'ajv';

/**
 * Direction of queue message flow
 */
export type QueueDirection = 'inbound' | 'outbound';

/**
 * Standard message envelope for all queue messages
 * 
 * @typeParam TPayload - The type of the message payload
 */
export interface QueueMessageEnvelope<TPayload = unknown> {
	/**
	 * Unique identifier for the message
	 */
	messageId: string;
	
	/**
	 * Timestamp when the message was created (ISO 8601)
	 */
	timestamp: string;
	
	/**
	 * Correlation ID for tracing related messages across services
	 */
	correlationId?: string;
	
	/**
	 * Name of the queue this message belongs to
	 */
	queueName: string;
	
	/**
	 * Direction of the message flow
	 */
	direction: QueueDirection;
	
	/**
	 * The actual message payload
	 */
	payload: TPayload;
	
	/**
	 * Optional custom metadata for the message
	 */
	metadata?: Record<string, string>;
}

/**
 * Configuration for blob logging metadata and tags
 */
export interface BlobLoggingConfig {
	/**
	 * Additional metadata to attach to the blob (beyond standard queue name and direction)
	 */
	metadata?: Record<string, string>;
	
	/**
	 * Tags to apply to the blob for categorization and filtering
	 */
	tags?: Record<string, string>;
}

/**
 * Configuration for a queue
 * 
 * @typeParam TPayload - The type of the payload for messages in this queue
 */
export interface QueueConfig<TPayload = unknown> {
	/**
	 * Name of the Azure Storage Queue
	 */
	queueName: string;
	
	/**
	 * Direction of message flow for this queue
	 */
	direction: QueueDirection;
	
	/**
	 * JSON schema for validating the message payload
	 */
	payloadSchema: JSONSchemaType<TPayload>;
	
	/**
	 * Optional configuration for blob logging
	 */
	blobLogging?: BlobLoggingConfig;
}

/**
 * Result of sending a message to a queue
 */
export interface SendMessageResult {
	/**
	 * ID of the message in the queue
	 */
	messageId: string;
	
	/**
	 * Timestamp when the message was inserted
	 */
	insertionTime: Date;
	
	/**
	 * Timestamp when the message will expire
	 */
	expirationTime: Date;
	
	/**
	 * Pop receipt (used for updating/deleting the message)
	 */
	popReceipt: string;
	
	/**
	 * Time when the message will become visible
	 */
	nextVisibleTime: Date;
}

/**
 * Result of receiving a message from a queue
 * 
 * @typeParam TPayload - The type of the message payload
 */
export interface ReceiveMessageResult<TPayload = unknown> {
	/**
	 * The decoded and validated message envelope
	 */
	message: QueueMessageEnvelope<TPayload>;
	
	/**
	 * ID of the message in the queue
	 */
	messageId: string;
	
	/**
	 * Pop receipt (required for deleting the message)
	 */
	popReceipt: string;
	
	/**
	 * Number of times this message has been dequeued
	 */
	dequeueCount: number;
}

/**
 * Options for receiving messages from a queue
 */
export interface ReceiveMessageOptions {
	/**
	 * Maximum number of messages to receive (1-32)
	 * @default 1
	 */
	maxMessages?: number;
	
	/**
	 * Visibility timeout in seconds (how long the message is hidden after being received)
	 * @default 30
	 */
	visibilityTimeout?: number;
	
	/**
	 * Maximum time to wait for a message in seconds
	 * @default 30
	 */
	timeout?: number;
}

/**
 * Error thrown when message validation fails
 */
export class MessageValidationError extends Error {
	readonly validationErrors: unknown[];
	
	constructor(
		message: string,
		validationErrors: unknown[],
	) {
		super(message);
		this.name = 'MessageValidationError';
		this.validationErrors = validationErrors;
	}
}

/**
 * Error thrown when blob logging fails
 */
export class BlobLoggingError extends Error {
	override readonly cause?: Error;
	
	constructor(
		message: string,
		errorCause?: Error,
	) {
		super(message);
		this.name = 'BlobLoggingError';
		if (errorCause !== undefined) {
			this.cause = errorCause;
		}
	}
}
