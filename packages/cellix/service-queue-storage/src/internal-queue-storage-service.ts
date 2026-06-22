import { DefaultAzureCredential, type TokenCredential } from '@azure/identity';
import type { QueueClient, QueueReceiveMessageOptions } from '@azure/storage-queue';
import { QueueServiceClient } from '@azure/storage-queue';
import { diag } from '@opentelemetry/api';
import type { IQueueStorageOperations, PeekMessagesOptions, QueueLoggingConfig, QueueMessage, QueueStorageConfig, ReceiveMessagesOptions, SendMessageOptions } from './interfaces.ts';
import { createQueueMessageLogger, type IQueueMessageLogger, type MessageLogEnvelope, type QueueMessageLogBlobStorage } from './logging.ts';

/**
 * Public lifecycle contract implemented by registered queue services.
 *
 * Registered queue services are started during application bootstrap and should be
 * shut down when the hosting process disposes infrastructure services.
 *
 * @example
 * ```ts
 * const service = new queueRegistry.Service({ connectionString: 'UseDevelopmentStorage=true' });
 * await service.startUp();
 * await service.shutDown();
 * ```
 */
export interface QueueServiceLifecycle {
	/**
	 * Starts the queue service and returns the same instance for fluent bootstrap flows.
	 *
	 * @returns The started queue service instance.
	 */
	startUp(): Promise<this>;
	/**
	 * Releases held client references and makes shutdown idempotent.
	 *
	 * @returns Resolves when shutdown work has completed.
	 */
	shutDown(): Promise<void>;
}

/**
 * Public logging configuration contract implemented by registered queue services.
 *
 * Logging can be enabled after construction so applications using fluent
 * infrastructure registration can opt in only when a compatible logger
 * dependency is available from the service registry.
 *
 * @example
 * ```ts
 * const service = new queueRegistry.Service({ connectionString: 'UseDevelopmentStorage=true' });
 * service.enableLogging(blobStorage, { enabled: true, container: 'queue-logs' });
 * ```
 */
export interface QueueServiceLogging {
	/**
	 * Enables queue message logging for subsequent send and receive operations.
	 *
	 * @param loggerOrBlobStorage - Logger implementation or blob storage dependency
	 * that will persist resolved message envelopes.
	 * @param config - Optional runtime logging behavior such as container name and await mode.
	 * @returns The same service instance for fluent configuration.
	 */
	enableLogging(loggerOrBlobStorage: IQueueMessageLogger | QueueMessageLogBlobStorage, config?: QueueLoggingConfig): this;
	/**
	 * Disables queue message logging for subsequent send and receive operations.
	 *
	 * @returns The same service instance for fluent configuration.
	 */
	disableLogging(): this;
}

/** Internal transport contract used to bind typed queue methods onto the base Azure service. */
export type InternalQueueTransport = IQueueStorageOperations &
	QueueServiceLifecycle &
	QueueServiceLogging & {
		getLogger(): IQueueMessageLogger | undefined;
		isLoggingEnabled(): boolean;
		shouldAwaitLogging(): boolean;
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
	private logger: IQueueMessageLogger | undefined;
	private loggingConfig: QueueLoggingConfig | undefined;

	constructor(options: QueueStorageConfig) {
		this.options = options;
		this.loggingConfig = options.logging;
		if (options.logger) {
			this.logger = this.resolveLogger(options.logger, options.logging);
		}
		if (options.connectionString) this.inferredMode = 'sharedKey';
		else if (options.accountName) this.inferredMode = 'managedIdentity';
	}

	public enableLogging(loggerOrBlobStorage: IQueueMessageLogger | QueueMessageLogBlobStorage, config?: QueueLoggingConfig): this {
		const nextConfig = config ?? this.loggingConfig ?? this.options.logging ?? { enabled: true, container: '' };
		this.logger = this.resolveLogger(loggerOrBlobStorage, nextConfig);
		this.loggingConfig = nextConfig;
		return this;
	}

	public disableLogging(): this {
		this.logger = undefined;
		this.loggingConfig = { ...(this.loggingConfig ?? this.options.logging ?? { enabled: true, container: '' }), enabled: false };
		return this;
	}

	public getLogger(): IQueueMessageLogger | undefined {
		return this.logger;
	}

	public isLoggingEnabled(): boolean {
		return this.loggingConfig?.enabled === true && this.logger !== undefined;
	}

	public shouldAwaitLogging(): boolean {
		return this.loggingConfig?.await === true;
	}

	/**
	 * Start the service and initialize the Azure QueueServiceClient.
	 *
	 * @returns The started service instance (useful for chaining in tests)
	 */
	public async startUp(): Promise<this> {
		await Promise.resolve();
		if (this.started) return this;

		if (this.inferredMode === 'sharedKey') {
			this.queueServiceClient = QueueServiceClient.fromConnectionString(this.options.connectionString as string);
			this.started = true;
			diag.info('[InternalQueueStorageService] started (sharedKey)');

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
							diag.warn('[InternalQueueStorageService] failed to auto-provision queue', { queueName: q, error: e });
						}
					}
				}
			}

			return this;
		}

		if (this.inferredMode === 'managedIdentity') {
			const accountName = this.options.accountName as string;
			const credential: TokenCredential = this.options.credential ?? new DefaultAzureCredential();
			const url = `https://${accountName}.queue.core.windows.net`;
			this.queueServiceClient = new QueueServiceClient(url, credential);
			this.started = true;
			diag.info('[InternalQueueStorageService] started (managedIdentity)', { accountName, endpoint: url });
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

	private resolveLogger(
		loggerOrBlobStorage: IQueueMessageLogger | QueueMessageLogBlobStorage,
		config?: QueueLoggingConfig,
	): IQueueMessageLogger {
		if ('logMessage' in loggerOrBlobStorage) {
			return loggerOrBlobStorage;
		}
		if (!config?.container.trim()) {
			throw new Error('Provide logging.container when enabling blob-backed queue logging');
		}
		return createQueueMessageLogger(loggerOrBlobStorage, config.container);
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
			diag.warn('[InternalQueueStorageService] createQueueIfNotExists failed', { queueName: queue, error: e });
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
		const res = await queueClient.sendMessage(encoded, {
			...(typeof opts?.visibilityTimeoutSeconds === 'number' ? { visibilityTimeout: opts.visibilityTimeoutSeconds } : {}),
		});

		// Logging: if configured and logger provided, record envelope
		if (this.isLoggingEnabled()) {
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
					await this.logger?.logMessage(envelope);
				} catch (e) {
					diag.error('[InternalQueueStorageService] logging failed', e);
				}
			};

			if (this.shouldAwaitLogging()) await doLog();
			else void doLog();
		}
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
