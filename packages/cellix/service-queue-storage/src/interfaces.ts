import type { TokenCredential } from '@azure/identity';
import type { IQueueMessageLogger, QueueMessageLogBlobStorage } from './logging.ts';

/**
 * Runtime logging behavior for a registered queue service.
 *
 * Pass this either in the initial {@link QueueStorageConfig} or later through
 * `service.enableLogging(logger, config)` when logging should be optional.
 *
 * @example
 * ```ts
 * const config: QueueLoggingConfig = {
 *   enabled: true,
 *   container: 'queue-logs',
 *   await: false,
 * };
 * ```
 */
export type QueueLoggingConfig = {
	/** Enables or disables queue message logging for subsequent operations. */
	enabled: boolean;
	/** Blob container name used by blob-backed loggers such as `BlobQueueMessageLogger`. */
	container: string;
	/** When `true`, queue operations wait for logging to complete before resolving. */
	await?: boolean;
};

// Phantom symbol used solely for payload type inference — never set at runtime
declare const _queuePayload: unique symbol;

/**
 * Construction options for registered queue services.
 *
 * Provide either `connectionString` for local/shared-key access or `accountName`
 * for managed identity access. A custom `credential` can be supplied for the
 * managed-identity path when a host wants to override `DefaultAzureCredential`.
 * Logging is optional but, when enabled, is applied automatically by the typed
 * send and receive methods created through `registerQueues()`.
 *
 * `provisionQueues` is intended for local development and Azurite startup, not
 * production infrastructure management.
 *
 * @example
 * ```ts
 * const localConfig: QueueStorageConfig = {
 *   connectionString: 'UseDevelopmentStorage=true',
 *   provisionQueues: ['community-creation'],
 * };
 *
 * const managedIdentityConfig: QueueStorageConfig = {
 *   accountName: 'my-storage-account',
 * };
 * ```
 */
export type QueueStorageConfig = {
	/** Azure Storage account name used with `DefaultAzureCredential` authentication. */
	accountName?: string;
	/** Optional credential override used with `accountName` instead of `DefaultAzureCredential`. */
	credential?: TokenCredential;
	/** Azure Queue Storage connection string used for shared-key or Azurite access. */
	connectionString?: string;
	/** Queue names to create automatically in development or Azurite scenarios. */
	provisionQueues?: string[];
	/** Optional runtime logging behavior for typed send and receive operations. */
	logging?: QueueLoggingConfig;
	/** Logger implementation or blob storage dependency used when queue logging is enabled. */
	logger?: IQueueMessageLogger | QueueMessageLogBlobStorage;
};

/**
 * Message shape returned from typed receive and peek queue methods.
 *
 * `payload` carries the decoded queue message body, while `id`, `popReceipt`, and
 * `dequeueCount` reflect Azure Queue Storage delivery metadata when available.
 *
 * @typeParam T - Decoded payload type for the queue definition being read.
 *
 * @example
 * ```ts
 * const message: QueueMessage<{ requestId: string }> = {
 *   id: 'msg-1',
 *   payload: { requestId: 'req-123' },
 *   dequeueCount: 1,
 * };
 * ```
 */
export type QueueMessage<T = unknown> = {
	/** Azure Queue Storage message identifier. */
	id: string;
	/** Pop receipt required when deleting a received message. */
	popReceipt?: string;
	/** Decoded queue payload. */
	payload: T;
	/** Number of times Azure Queue Storage has dequeued the message. */
	dequeueCount?: number;
};

/** Queue direction used when persisting message logs. */
export type QueueDirection = 'inbound' | 'outbound';

/**
 * Logging and delivery options used internally by typed queue producer methods.
 *
 * Consumers normally do not create this object directly; it is derived from queue
 * definitions and logging configuration.
 *
 * @remarks
 * This type is public because the low-level transport contract is public, but
 * application code should usually prefer typed queue methods created by
 * `registerQueues()` over constructing these options manually.
 */
export type SendMessageOptions = {
	/** Number of seconds Azure should delay visibility of the message after enqueue. */
	visibilityTimeoutSeconds?: number;
	/** Already-resolved blob index tags to attach to the logged message envelope */
	loggingTags?: Record<string, string>;
	/** Already-resolved blob metadata to attach to the logged message envelope */
	loggingMetadata?: Record<string, string>;
	/** Queue direction used by the blob logger when persisting the payload */
	loggingDirection?: QueueDirection;
};

/**
 * Options for low-level receive operations.
 *
 * @remarks
 * Most consumers use generated `receiveFrom...Queue()` methods instead of this
 * transport-level option bag.
 */
export type ReceiveMessagesOptions = {
	/** Maximum number of messages to request from Azure in one receive call. */
	maxMessages?: number;
	/** Number of seconds Azure should hide received messages before they become visible again. */
	visibilityTimeout?: number;
};

/**
 * Options for low-level peek operations.
 *
 * @remarks
 * Most consumers use generated `peekAt...Queue()` methods instead of this
 * transport-level option bag.
 */
export type PeekMessagesOptions = {
	/** Maximum number of messages to peek without dequeuing. */
	maxMessages?: number;
};

/**
 * Internal raw queue transport contract implemented by the Azure queue service.
 *
 * Application consumers should use registered typed queue methods instead of this
 * lower-level transport surface.
 *
 * @remarks
 * This interface is exported for advanced integrations and testing, but it is
 * intentionally narrower than the application-facing surface returned by
 * `registerQueues()`.
 */
export interface IQueueStorageOperations {
	/**
	 * Sends a raw message to a physical queue.
	 *
	 * @typeParam _T - Payload type expected by the caller. This is not validated automatically.
	 * @param queue - Physical Azure Queue Storage queue name.
	 * @param message - Raw string payload or object to serialize as JSON.
	 * @param opts - Optional delivery and logging options.
	 * @returns Resolves when Azure accepts the message.
	 */
	sendMessage<_T = unknown>(queue: string, message: string | object, opts?: SendMessageOptions): Promise<void>;
	/**
	 * Receives and decodes messages from a physical queue.
	 *
	 * @typeParam _T - Expected decoded payload type.
	 * @param queue - Physical Azure Queue Storage queue name.
	 * @param opts - Optional receive settings such as batch size and visibility timeout.
	 * @returns Decoded queue messages in dequeue order.
	 */
	receiveMessages<_T = unknown>(queue: string, opts?: ReceiveMessagesOptions): Promise<QueueMessage<_T>[]>;
	/**
	 * Deletes a previously received message.
	 *
	 * @param queue - Physical Azure Queue Storage queue name.
	 * @param messageId - Azure message identifier.
	 * @param popReceipt - Azure pop receipt returned by a receive operation.
	 * @returns Resolves when Azure accepts the delete request.
	 */
	deleteMessage(queue: string, messageId: string, popReceipt: string): Promise<void>;
	/**
	 * Peeks at messages without dequeuing them.
	 *
	 * @typeParam _T - Expected decoded payload type.
	 * @param queue - Physical Azure Queue Storage queue name.
	 * @param opts - Optional peek settings such as batch size.
	 * @returns Decoded queue messages without altering visibility or dequeue state.
	 */
	peekMessages<_T = unknown>(queue: string, opts?: PeekMessagesOptions): Promise<QueueMessage<_T>[]>;
}

type QueueMessageSchema = Readonly<Record<string, unknown>>;
type PayloadFieldRef<TKey extends string = string> = { payloadField: TKey };

/**
 * Typed `$payload` helper shape used when authoring logging tags and metadata.
 *
 * Each property access produces a `{ payloadField: 'fieldName' }` reference that
 * can be stored in a queue definition and resolved later against a runtime payload.
 *
 * @typeParam TPayload - Queue payload type whose keys should be addressable.
 *
 * @example
 * ```ts
 * type CommunityCreated = { communityId: string; createdBy: string };
 * const $payload = payloadFields<CommunityCreated>();
 *
 * const metadata = {
 *   communityId: $payload.communityId,
 *   createdBy: $payload.createdBy,
 * };
 * ```
 */
export type PayloadFieldProxy<TPayload extends object> = {
	[K in Extract<keyof TPayload, string>]-?: PayloadFieldRef<K>;
};
export type AnyLoggingFieldSpec = string | PayloadFieldRef<string>;
type QueueDefinitionBase = {
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
 *
 * @typeParam TPayload - Payload type whose keys may be referenced when using `{ payloadField: ... }`.
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
 * message type for compile-time safety. It does not appear in the runtime object -
 * set it by providing an explicit type annotation or using `satisfies`.
 *
 * @typeParam TPayload - Logical payload type associated with this queue definition.
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
 *
 * @typeParam TPayload - Payload type carried by the outbound queue.
 */
export type OutboundQueueDefinition<TPayload = object> = QueueDefinition<TPayload> & {
	readonly _direction?: 'outbound';
};

/**
 * Tag type for inbound queues (messages received by the application).
 * Structurally identical to QueueDefinition but provides compile-time
 * and runtime distinction for logging purposes.
 *
 * @typeParam TPayload - Payload type carried by the inbound queue.
 */
export type InboundQueueDefinition<TPayload = object> = QueueDefinition<TPayload> & {
	readonly _direction?: 'inbound';
};

export type QueueMap<T extends QueueDefinitionBase = QueueDefinitionBase> = Record<string, T>;

/** Extracts the payload type from a QueueDefinition phantom type parameter. */
export type MessagePayload<D> = D extends QueueDefinition<infer P> ? (P extends undefined ? unknown : P) : unknown;
