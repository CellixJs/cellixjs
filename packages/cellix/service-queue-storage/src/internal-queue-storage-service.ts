import { DefaultAzureCredential, type TokenCredential } from '@azure/identity';
import type { QueueClient, QueueReceiveMessageOptions } from '@azure/storage-queue';
import { QueueServiceClient } from '@azure/storage-queue';
import type { IQueueStorageOperations, PeekMessagesOptions, QueueMessage, QueueStorageConfig, ReceiveMessagesOptions, SendMessageOptions } from './interfaces.js';
import type { MessageLogEnvelope } from './logging.js';

/**
 * Public lifecycle contract implemented by registered queue services.
 *
 * Registered queue services are started during application bootstrap and should be
 * shut down when the hosting process disposes infrastructure services.
 */
export interface QueueServiceLifecycle {
	/** Starts the service and returns the started instance for fluent bootstrap flows. */
	startUp(): Promise<this>;
	/** Releases any held client references and makes shutdown idempotent. */
	shutDown(): Promise<void>;
}

/** Internal transport contract used to bind typed queue methods onto the base Azure service. */
export type InternalQueueTransport = IQueueStorageOperations &
	QueueServiceLifecycle & {
		createQueueIfNotExists(queue: string): Promise<void>;
	};

/**
 * InternalQueueStorageService is a thin wrapper around Azure Queue Storage that provides
 * typed send/receive/peek operations and optional message logging to a blob
 * storage sink.
 *
 * The service supports two authentication modes: shared key (connection string)
 * and managed identity (account name + DefaultAzureCredential). It also can
 * auto-provision queues during startup when running in development against
 * Azurite.
 *
 * @example
 * ```ts
 * const svc = new InternalQueueStorageService({ connectionString: 'UseDevelopmentStorage=true' });
 * await svc.startUp();
 * await svc.sendMessage('my-queue', { hello: 'world' });
 * ```
 *
 * @returns The class exposes lifecycle methods such as `startUp()` which returns the started service instance for chaining.
 */
export class InternalQueueStorageService implements InternalQueueTransport {
	protected options: QueueStorageConfig;
	private inferredMode: 'sharedKey' | 'managedIdentity' | undefined;
	private queueServiceClient: QueueServiceClient | undefined = undefined;
	private started = false;

	constructor(options: QueueStorageConfig) {
		this.options = options;
		if (options.connectionString) this.inferredMode = 'sharedKey';
		else if (options.accountName) this.inferredMode = 'managedIdentity';
	}

	/**
	 * Start the service and initialize the Azure QueueServiceClient.
	 *
	 * @returns The started service instance (useful for chaining in tests)
	 */
	public async startUp(): Promise<this> {
		await Promise.resolve();
		if (this.started) return this;
		this.started = true;

		if (this.inferredMode === 'sharedKey') {
			this.queueServiceClient = QueueServiceClient.fromConnectionString(this.options.connectionString as string);
			console.info('[InternalQueueStorageService] started (sharedKey)');

			// Auto-provision queues in local dev / azurite scenarios when requested
			const conn = this.options.connectionString as string;
			const isAzuriteConnection = conn.includes('UseDevelopmentStorage=true') || conn.includes('127.0.0.1');
			const nodeEnv = (process.env as unknown as { NODE_ENV?: string }).NODE_ENV;
			if (nodeEnv === 'development' || isAzuriteConnection) {
				if (Array.isArray(this.options.provisionQueues)) {
					for (const q of this.options.provisionQueues) {
						try {
							await this.createQueueIfNotExists(q);
						} catch (e) {
							console.warn('[InternalQueueStorageService] failed to auto-provision queue', q, e);
						}
					}
				}
			}

			return this;
		}

		if (this.inferredMode === 'managedIdentity') {
			const accountName = this.options.accountName as string;
			const credential: TokenCredential = new DefaultAzureCredential();
			const url = `https://${accountName}.queue.core.windows.net`;
			this.queueServiceClient = new QueueServiceClient(url, credential);
			console.info('[InternalQueueStorageService] started (managedIdentity)');
			return this;
		}

		throw new Error('Invalid queue storage configuration: provide connectionString or accountName');
	}

	public shutDown(): Promise<void> {
		if (!this.queueServiceClient) return Promise.resolve();
		this.queueServiceClient = undefined;
		this.started = false;
		return Promise.resolve();
	}

	private getQueueClient(queue: string): QueueClient {
		if (!this.queueServiceClient) throw new Error('Queue storage service is not started');
		return this.queueServiceClient.getQueueClient(queue);
	}

	/**
	 * Ensure a queue exists. Useful for localDev auto-provisioning.
	 *
	 * @param queue - queue name to ensure exists
	 */
	public async createQueueIfNotExists(queue: string): Promise<void> {
		const q = this.getQueueClient(queue);
		// createIfNotExists is supported by Azure SDK QueueClient
		try {
			await q.createIfNotExists();
		} catch (e) {
			console.warn('[InternalQueueStorageService] createQueueIfNotExists failed for', queue, e);
		}
	}

	/**
	 * Send a raw message (string or object) to a queue. Objects are JSON-serialized.
	 *
	 * @param queue - target queue name
	 * @param message - message payload (object or already-serialized string)
	 * @param opts - optional send options (visibility timeout, logging tags)
	 */
	public async sendMessage<_T = unknown>(queue: string, message: string | object, opts?: SendMessageOptions): Promise<void> {
		const queueClient = this.getQueueClient(queue);
		const body = typeof message === 'string' ? message : JSON.stringify(message);
		const encoded = Buffer.from(body).toString('base64');
		const res = await queueClient.sendMessage(encoded);

		// Logging: if configured and logger provided, record envelope
		if (this.options.logging?.enabled && this.options.logger) {
			const direction = opts?.loggingDirection ?? 'outbound';
			const mergedTags = { ...(opts?.loggingTags ?? {}), queueName: queue };
			const mergedMetadata = opts?.loggingMetadata ?? undefined;
			const envelope: MessageLogEnvelope = {
				queue,
				direction,
				messageId: (res as unknown as { messageId?: string })?.messageId ?? '',
				payload:
					typeof message === 'string'
						? (() => {
								try {
									return JSON.parse(message);
								} catch {
									return message;
								}
							})()
						: message,
				createdAt: new Date().toISOString(),
				...(mergedMetadata !== undefined ? { metadata: mergedMetadata } : {}),
				tags: mergedTags,
			};

			const doLog = async () => {
				try {
					await this.options.logger?.logMessage(envelope);
				} catch (e) {
					console.error('[InternalQueueStorageService] logging failed', e);
				}
			};

			if (this.options.logging?.await) await doLog();
			else void doLog();
		}
	}

	/**
	 * Send a message using a precompiled validation/encoding contract.
	 */
	public async sendValidatedMessage<T>(queue: string, contract: { encode(payload: T): string }, payload: T, opts?: SendMessageOptions): Promise<void> {
		const encoded = contract.encode(payload);
		await this.sendMessage(queue, encoded, opts);
	}

	/**
	 * Receive messages from a queue and decode JSON payloads where possible.
	 *
	 * @param queue - queue name to receive from
	 * @param opts - optional receive options (max messages, visibility timeout)
	 * @returns Array of received messages with decoded payloads when possible
	 */
	public async receiveMessages<_T = unknown>(queue: string, opts?: ReceiveMessagesOptions): Promise<QueueMessage<_T>[]> {
		const queueClient = this.getQueueClient(queue);

		const receiveOpts: QueueReceiveMessageOptions = { numberOfMessages: opts?.maxMessages ?? 1 };
		if (typeof opts?.visibilityTimeout === 'number') {
			receiveOpts.visibilityTimeout = opts.visibilityTimeout as number;
		}
		const res = await queueClient.receiveMessages(receiveOpts);
		const messages: QueueMessage<_T>[] = [];
		if (res.receivedMessageItems) {
			for (const m of res.receivedMessageItems) {
				let payload: unknown = m.messageText ?? '';
				try {
					const decoded = Buffer.from(String(payload), 'base64').toString('utf-8');
					payload = JSON.parse(decoded);
				} catch (_e) {
					// non-JSON or decode issue - keep raw
				}
				messages.push({ id: m.messageId, popReceipt: m.popReceipt, payload: payload as _T, dequeueCount: m.dequeueCount });
			}
		}
		return messages;
	}

	/**
	 * Delete a received message using its id and popReceipt
	 */
	public async deleteMessage(queue: string, messageId: string, popReceipt: string): Promise<void> {
		const q = this.getQueueClient(queue);
		await q.deleteMessage(messageId, popReceipt);
	}

	/**
	 * Peek at messages from a queue without dequeuing them.
	 */
	public async peekMessages<_T = unknown>(queue: string, opts?: PeekMessagesOptions): Promise<QueueMessage<_T>[]> {
		const q = this.getQueueClient(queue);
		const res = await q.peekMessages({ numberOfMessages: opts?.maxMessages ?? 32 });
		const out: QueueMessage<_T>[] = [];
		if (res.peekedMessageItems) {
			for (const m of res.peekedMessageItems) {
				let payload: unknown = m.messageText ?? '';
				try {
					const decoded = Buffer.from(String(payload), 'base64').toString('utf-8');
					payload = JSON.parse(decoded);
				} catch (_e) {
					// ignore
				}
				out.push({ id: m.messageId as string, payload: payload as _T, dequeueCount: m.dequeueCount });
			}
		}
		return out;
	}
}
