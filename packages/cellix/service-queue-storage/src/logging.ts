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

type BlobStorageLike = {
	uploadText(request: { containerName: string; blobName: string; text: string; metadata?: Record<string, string>; tags?: Record<string, string> }): Promise<unknown>;
};

/**
 * BlobQueueMessageLogger persists queue message envelopes to a blob storage
 * container. The blob content is the payload JSON itself, while queue direction,
 * queue name, and any resolved tags or metadata are expressed through the blob path
 * and blob properties.
 *
 * This helper is intentionally minimal so it can be adapted to different blob
 * storage clients in tests and production.
 *
 * @param blobStorage - Blob service abstraction with an `uploadText()` method.
 * @param containerName - Blob container that should receive queue message logs.
 * @returns When messages are logged the helper returns a {@link LogAddress} describing where the envelope was stored.
 * @example
 * ```typescript
 * const logger = new BlobQueueMessageLogger(myBlobClient, 'queue-logs');
 * await logger.logMessage({ queue: 'email', payload: { to: 'a@b.com' }, createdAt: new Date().toISOString() });
 * ```
 */
export class BlobQueueMessageLogger implements IQueueMessageLogger {
	private readonly blobStorage: BlobStorageLike;
	private readonly containerName: string;
	constructor(blobStorage: BlobStorageLike, containerName: string) {
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

function toIsoTimestamp(createdAt?: string): string {
	const date = createdAt ? new Date(createdAt) : new Date();
	return Number.isNaN(date.valueOf()) ? new Date().toISOString() : date.toISOString();
}
