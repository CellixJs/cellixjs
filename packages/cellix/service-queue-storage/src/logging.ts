import type { QueueDirection } from './interfaces.ts';

/**
 * Envelope stored for logged queue messages. Contains queue name, optional
 * messageId (from Azure), the original payload, optional blob metadata,
 * optional blob index tags, queue direction, and a creation timestamp.
 *
 * @example
 * ```ts
 * const envelope: MessageLogEnvelope = {
 *   queue: 'community-creation',
 *   direction: 'outbound',
 *   messageId: 'msg-123',
 *   payload: { communityId: 'community-1' },
 *   tags: { domain: 'community' },
 *   createdAt: new Date().toISOString(),
 * };
 * ```
 */
export type MessageLogEnvelope = {
	queue: string;
	direction: QueueDirection;
	messageId?: string;
	payload: unknown;
	metadata?: Record<string, string>;
	tags?: Record<string, string>;
	createdAt?: string;
};

type LogAddress = { container: string; blobName: string; url?: string };

/**
 * Pluggable sink for queue message logging.
 *
 * Supply an implementation through `QueueStorageConfig.logger` or
 * `service.enableLogging(...)` when queue message delivery should also persist
 * a durable audit copy.
 */
export interface IQueueMessageLogger {
	/**
	 * Persists one queue message envelope.
	 *
	 * @param envelope - Resolved queue message information ready for persistence.
	 * @returns Address information describing where the message was stored.
	 */
	logMessage(envelope: MessageLogEnvelope): Promise<LogAddress>;
}

/**
 * Minimal blob-storage contract accepted for blob-backed queue logging.
 *
 * Consumers can provide a storage service with this shape to
 * `service.enableLogging(...)` and the framework will adapt it into an internal
 * queue-message logger automatically.
 */
export type QueueMessageLogBlobStorage = {
	uploadText(request: { containerName: string; blobName: string; text: string; metadata?: Record<string, string>; tags?: Record<string, string> }): Promise<unknown>;
};

/**
 * Internal blob-backed queue logger used when consumers provide a storage
 * service instead of a custom logger implementation.
 */
class BlobQueueMessageLogger implements IQueueMessageLogger {
	private readonly blobStorage: QueueMessageLogBlobStorage;
	private readonly containerName: string;
	constructor(blobStorage: QueueMessageLogBlobStorage, containerName: string) {
		this.blobStorage = blobStorage;
		this.containerName = containerName;
	}

	/**
	 * Persist a message envelope to blob storage.
	 *
	 * @param envelope - the message envelope to persist
	 * @returns Address information for the stored blob
	 * @example
	 * ```ts
	 * const addr = await logger.logMessage({ queue: 'email', payload: { to: 'a@b.com' }, createdAt: new Date().toISOString() });
	 * console.log(addr.container, addr.blobName)
	 * ```
	 */
	public async logMessage(envelope: MessageLogEnvelope): Promise<LogAddress> {
		const name = `${envelope.direction}/${toIsoTimestamp(envelope.createdAt)}.json`;
		const text = JSON.stringify(envelope.payload, null, 2);
		const tags = { ...(envelope.tags ?? {}), queueName: envelope.queue };
		await this.blobStorage.uploadText({
			containerName: this.containerName,
			blobName: name,
			text,
			...(envelope.metadata !== undefined ? { metadata: envelope.metadata } : {}),
			tags,
		});
		return { container: this.containerName, blobName: name, url: `${this.containerName}/${name}` };
	}
}

function isQueueMessageLogger(value: IQueueMessageLogger | QueueMessageLogBlobStorage): value is IQueueMessageLogger {
	return 'logMessage' in value;
}

export function createQueueMessageLogger(
	value: IQueueMessageLogger | QueueMessageLogBlobStorage,
	containerName: string,
): IQueueMessageLogger {
	if (isQueueMessageLogger(value)) {
		return value;
	}

	return new BlobQueueMessageLogger(value, containerName);
}

function toIsoTimestamp(createdAt?: string): string {
	const date = createdAt ? new Date(createdAt) : new Date();
	return Number.isNaN(date.valueOf()) ? new Date().toISOString() : date.toISOString();
}
