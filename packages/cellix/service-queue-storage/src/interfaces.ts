import type { ZodTypeAny } from 'zod';
import type { IQueueMessageLogger } from './logging.js';

export type QueueStorageConfig = {
	accountName?: string;
	connectionString?: string;
	localDev?: boolean;
	/** Optional list of queues that should be auto-provisioned in local/dev environments */
	provisionQueues?: string[];
	logging?: {
		enabled: boolean;
		container: string;
		await?: boolean;
	};
	/** Optional logger implementation for persisting message envelopes */
	logger?: IQueueMessageLogger;
};

export type QueueMessage<T = unknown> = {
	id: string;
	popReceipt?: string;
	payload: T;
	dequeueCount?: number;
};

export type SendMessageOptions = { visibilityTimeoutSeconds?: number; loggingTags?: Record<string, string> };
export type ReceiveMessagesOptions = { maxMessages?: number; visibilityTimeout?: number };
export type PeekMessagesOptions = { maxMessages?: number };

export interface IQueueStorageOperations {
	sendMessage<_T = unknown>(queue: string, message: string | object, opts?: SendMessageOptions): Promise<void>;
	sendValidatedMessage<T>(queue: string, contract: QueueMessageContract<T>, payload: T, opts?: SendMessageOptions): Promise<void>;
	receiveMessages<_T = unknown>(queue: string, opts?: ReceiveMessagesOptions): Promise<QueueMessage<_T>[]>;
	deleteMessage(queue: string, messageId: string, popReceipt: string): Promise<void>;
	peekMessages<_T = unknown>(queue: string, opts?: PeekMessagesOptions): Promise<QueueMessage<_T>[]>;
}

export interface IQueueConsumerOperations {
	receiveMessages<T = unknown>(queue: string, opts?: ReceiveMessagesOptions): Promise<QueueMessage<T>[]>;
	deleteMessage(queue: string, messageId: string, popReceipt: string): Promise<void>;
}

export type QueueMessageContract<T> = {
	encode(payload: T): string;
	decode(raw: string): T;
};

// New: explicit schema shapes for application-level queue definitions
export type OutboundQueueSchema<S extends ZodTypeAny = ZodTypeAny> = {
	queueName: string;
	schema: S;
	loggingTags?: Record<string, string>;
};

export type InboundQueueSchema<S extends ZodTypeAny = ZodTypeAny> = {
	queueName: string;
	schema: S;
	loggingTags?: Record<string, string>;
};

export type OutboundQueueMap = Record<string, OutboundQueueSchema>;
export type InboundQueueMap = Record<string, InboundQueueSchema>;
