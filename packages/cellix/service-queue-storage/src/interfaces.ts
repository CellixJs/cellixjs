import type { IQueueMessageLogger } from './logging.js';

// Phantom symbol used solely for payload type inference — never set at runtime
declare const _queuePayload: unique symbol;

/**
 * Construction options for registered queue services.
 *
 * Provide either `connectionString` for local/shared-key access or `accountName`
 * for managed identity access. Logging is optional but, when enabled, is applied
 * automatically by the typed send and receive methods created through `registerQueues()`.
 *
 * `provisionQueues` is intended for local development and Azurite startup, not
 * production infrastructure management.
 */
export type QueueStorageConfig = {
	accountName?: string;
	connectionString?: string;
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

/**
 * Message shape returned from typed receive and peek queue methods.
 *
 * `payload` carries the decoded queue message body, while `id`, `popReceipt`, and
 * `dequeueCount` reflect Azure Queue Storage delivery metadata when available.
 */
export type QueueMessage<T = unknown> = {
	id: string;
	popReceipt?: string;
	payload: T;
	dequeueCount?: number;
};

/** Queue direction used when persisting message logs. */
export type QueueDirection = 'inbound' | 'outbound';

/**
 * Logging and delivery options used internally by typed queue producer methods.
 *
 * Consumers normally do not create this object directly; it is derived from queue
 * definitions and logging configuration.
 */
export type SendMessageOptions = {
	visibilityTimeoutSeconds?: number;
	/** Already-resolved blob index tags to attach to the logged message envelope */
	loggingTags?: Record<string, string>;
	/** Already-resolved blob metadata to attach to the logged message envelope */
	loggingMetadata?: Record<string, string>;
	/** Queue direction used by the blob logger when persisting the payload */
	loggingDirection?: QueueDirection;
};
export type ReceiveMessagesOptions = { maxMessages?: number; visibilityTimeout?: number };
export type PeekMessagesOptions = { maxMessages?: number };

/**
 * Internal raw queue transport contract implemented by the Azure queue service.
 *
 * Application consumers should use registered typed queue methods instead of this
 * lower-level transport surface.
 */
export interface IQueueStorageOperations {
	sendMessage<_T = unknown>(queue: string, message: string | object, opts?: SendMessageOptions): Promise<void>;
	sendValidatedMessage<T>(queue: string, contract: QueueMessageContract<T>, payload: T, opts?: SendMessageOptions): Promise<void>;
	receiveMessages<_T = unknown>(queue: string, opts?: ReceiveMessagesOptions): Promise<QueueMessage<_T>[]>;
	deleteMessage(queue: string, messageId: string, popReceipt: string): Promise<void>;
	peekMessages<_T = unknown>(queue: string, opts?: PeekMessagesOptions): Promise<QueueMessage<_T>[]>;
}

type QueueMessageContract<T> = {
	encode(payload: T): string;
	decode(raw: string): T;
};
export type QueueMessageSchema = Record<string, unknown>;
export type PayloadFieldRef<TKey extends string = string> = { payloadField: TKey };
export type PayloadFieldProxy<TPayload extends object> = {
	[K in Extract<keyof TPayload, string>]-?: PayloadFieldRef<K>;
};
export type AnyLoggingFieldSpec = string | PayloadFieldRef<string>;
export type QueueDefinitionBase = {
	queueName: string;
	schema: QueueMessageSchema;
	loggingTags?: Record<string, AnyLoggingFieldSpec>;
	loggingMetadata?: Record<string, AnyLoggingFieldSpec>;
};

/**
 * Describes a single logging field value: either a hardcoded string or a reference
 * to a top-level field on the message payload.
 *
 * Use the {@link $payload} proxy for clarity when extracting from the payload.
 *
 * @example
 * ```ts
 * import { $payload } from '@cellix/service-queue-storage';
 *
 * // hardcoded value
 * const spec: LoggingFieldSpec = 'community';
 *
 * // value extracted from payload.externalId at runtime
 * const spec: LoggingFieldSpec = $payload.externalId;
 * ```
 */
export type LoggingFieldSpec<TPayload = { [key: string]: unknown }> = string | PayloadFieldRef<Extract<keyof TPayload, string>>;

/**
 * QueueDefinition describes a single logical queue: its physical queue name,
 * the JSON Schema for AJV runtime validation, and optional logging field specs
 * for blob metadata and tags.
 *
 * Both `loggingTags` and `loggingMetadata` accept either hardcoded string values
 * or `{ payloadField: 'fieldName' }` references that are resolved against the
 * message payload at log time.
 *
 * The `TPayload` type parameter is a phantom type that declares the TypeScript
 * message type for compile-time safety. It does not appear in the runtime object —
 * set it by providing an explicit type annotation or using `satisfies`.
 *
 * @example
 * ```ts
 * export interface CommunityCreationMessage { communityId: string; externalId: string; createdBy: string }
 *
 * export const communityCreationQueue: QueueDefinition<CommunityCreationMessage> = {
 *   queueName: 'community-creation',
 *   schema: communityCreationSchema,
 *   loggingTags: { domain: 'community', externalId: { payloadField: 'externalId' } },
 *   loggingMetadata: { createdBy: { payloadField: 'createdBy' } }
 * }
 * ```
 */
export type QueueDefinition<TPayload = object> = QueueDefinitionBase & {
	/** Blob index tags — supports hardcoded strings and payload field references */
	loggingTags?: Record<string, LoggingFieldSpec<TPayload>>;
	/** Blob metadata — supports hardcoded strings and payload field references */
	loggingMetadata?: Record<string, LoggingFieldSpec<TPayload>>;
	readonly [_queuePayload]?: TPayload;
};

/**
 * Tag type for outbound queues (messages sent from the application).
 * Structurally identical to QueueDefinition but provides compile-time
 * and runtime distinction for logging purposes.
 */
export type OutboundQueueDefinition<TPayload = object> = QueueDefinition<TPayload> & {
	readonly _direction?: 'outbound';
};

/**
 * Tag type for inbound queues (messages received by the application).
 * Structurally identical to QueueDefinition but provides compile-time
 * and runtime distinction for logging purposes.
 */
export type InboundQueueDefinition<TPayload = object> = QueueDefinition<TPayload> & {
	readonly _direction?: 'inbound';
};

export type QueueMap<T extends QueueDefinitionBase = QueueDefinitionBase> = Record<string, T>;

/** Extracts the payload type from a QueueDefinition phantom type parameter. */
export type MessagePayload<D> = D extends QueueDefinition<infer P> ? (P extends undefined ? unknown : P) : unknown;
