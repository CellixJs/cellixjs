import type { IQueueMessageLogger } from './logging.js';

// Phantom symbol used solely for payload type inference — never set at runtime
declare const _queuePayload: unique symbol;

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

export type QueueMessage<T = unknown> = {
	id: string;
	popReceipt?: string;
	payload: T;
	dequeueCount?: number;
};

export type QueueDirection = 'inbound' | 'outbound';

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
type QueueMessageSchema = Record<string, unknown>;

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
export type LoggingFieldSpec = string | { payloadField: string };

/**
 * Proxy object for extracting field values from the message payload at runtime.
 * Makes it obvious that the value will come from the message, not a hardcoded string.
 *
 * @example
 * ```ts
 * import { $payload } from '@cellix/service-queue-storage';
 *
 * export const myQueue: QueueDefinition<MyMessage> = {
 *   queueName: 'my-queue',
 *   schema,
 *   loggingTags: {
 *     domain: 'user',              // hardcoded string
 *     externalId: $payload.externalId, // extracted from message at runtime
 *     userId: $payload.userId,         // extracted from message at runtime
 *   },
 *   loggingMetadata: {
 *     email: $payload.email,       // omitted if undefined in message
 *   },
 * };
 * ```
 */
export const $payload: Record<string, LoggingFieldSpec> = new Proxy(
	{},
	{
		get(_target, prop: string) {
			return { payloadField: prop };
		},
	},
);

/**
 * Resolves a map of {@link LoggingFieldSpec} entries against a message payload,
 * returning a plain `Record<string, string>` suitable for blob metadata or tags.
 * Fields whose payload references are missing or nullish are omitted from the result.
 */
export function resolveLoggingFields(specs: Record<string, LoggingFieldSpec> | undefined, payload: unknown): Record<string, string> | undefined {
	if (!specs) return undefined;
	const resolved: Record<string, string> = {};
	for (const [key, spec] of Object.entries(specs)) {
		if (typeof spec === 'string') {
			resolved[key] = spec;
		} else {
			const val = (payload as Record<string, unknown>)?.[spec.payloadField];
			if (val !== undefined && val !== null) {
				resolved[key] = String(val);
			}
		}
	}
	return Object.keys(resolved).length > 0 ? resolved : undefined;
}

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
export type QueueDefinition<TPayload = unknown> = {
	queueName: string;
	schema: QueueMessageSchema;
	/** Blob index tags — supports hardcoded strings and payload field references */
	loggingTags?: Record<string, LoggingFieldSpec>;
	/** Blob metadata — supports hardcoded strings and payload field references */
	loggingMetadata?: Record<string, LoggingFieldSpec>;
	readonly [_queuePayload]?: TPayload;
};

/**
 * Tag type for outbound queues (messages sent from the application).
 * Structurally identical to QueueDefinition but provides compile-time
 * and runtime distinction for logging purposes.
 */
export type OutboundQueueDefinition<TPayload = unknown> = QueueDefinition<TPayload> & {
	readonly _direction?: 'outbound';
};

/**
 * Tag type for inbound queues (messages received by the application).
 * Structurally identical to QueueDefinition but provides compile-time
 * and runtime distinction for logging purposes.
 */
export type InboundQueueDefinition<TPayload = unknown> = QueueDefinition<TPayload> & {
	readonly _direction?: 'inbound';
};

export type QueueMap<T extends QueueDefinition = QueueDefinition> = Record<string, T>;

/** Extracts the payload type from a QueueDefinition phantom type parameter. */
export type MessagePayload<D> = D extends QueueDefinition<infer P> ? (P extends undefined ? unknown : P) : unknown;
