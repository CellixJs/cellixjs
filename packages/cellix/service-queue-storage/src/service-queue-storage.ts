import { DefaultAzureCredential, type TokenCredential } from '@azure/identity';
import type { QueueClient, QueueReceiveMessageOptions } from '@azure/storage-queue';
import { QueueServiceClient } from '@azure/storage-queue';
import type { IQueueStorageOperations, PeekMessagesOptions, QueueMessage, QueueStorageConfig, ReceiveMessagesOptions, SendMessageOptions } from './interfaces.js';
import type { MessageLogEnvelope } from './logging.js';

export class ServiceQueueStorage implements IQueueStorageOperations {
	private options: QueueStorageConfig;
	private inferredMode: 'sharedKey' | 'managedIdentity' | undefined;
	private queueServiceClient: QueueServiceClient | undefined = undefined;
	private started = false;

	constructor(options: QueueStorageConfig) {
		this.options = options;
		if (options.connectionString) this.inferredMode = 'sharedKey';
		else if (options.accountName) this.inferredMode = 'managedIdentity';
	}

	public async startUp(): Promise<IQueueStorageOperations> {
		await Promise.resolve();
		if (this.started) return this;
		this.started = true;

		if (this.inferredMode === 'sharedKey') {
			this.queueServiceClient = QueueServiceClient.fromConnectionString(this.options.connectionString as string);
			console.info('[ServiceQueueStorage] started (sharedKey)');

			// Auto-provision queues in local dev / azurite scenarios when requested
			const conn = this.options.connectionString as string;
			const isAzuriteConnection = conn.includes('UseDevelopmentStorage=true') || conn.includes('127.0.0.1');
			if (this.options.localDev === true || isAzuriteConnection) {
				if (Array.isArray(this.options.provisionQueues)) {
					for (const q of this.options.provisionQueues) {
						try {
							await this.createQueueIfNotExists(q);
						} catch (e) {
							console.warn('[ServiceQueueStorage] failed to auto-provision queue', q, e);
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
			console.info('[ServiceQueueStorage] started (managedIdentity)');
			return this;
		}

		throw new Error('Invalid ServiceQueueStorage configuration: provide connectionString or accountName');
	}

	public shutDown(): Promise<void> {
		if (!this.queueServiceClient) return Promise.resolve();
		this.queueServiceClient = undefined;
		this.started = false;
		return Promise.resolve();
	}

	private getQueueClient(queue: string): QueueClient {
		if (!this.queueServiceClient) throw new Error('ServiceQueueStorage is not started');
		return this.queueServiceClient.getQueueClient(queue);
	}

	/**
	 * Ensure a queue exists. Useful for localDev auto-provisioning.
	 */
	public async createQueueIfNotExists(queue: string): Promise<void> {
		const q = this.getQueueClient(queue);
		// createIfNotExists is supported by Azure SDK QueueClient
		try {
			await q.createIfNotExists();
		} catch (e) {
			console.warn('[ServiceQueueStorage] createQueueIfNotExists failed for', queue, e);
		}
	}

	public async sendMessage<_T = unknown>(queue: string, message: string | object, opts?: SendMessageOptions): Promise<void> {
		const queueClient = this.getQueueClient(queue);
		const body = typeof message === 'string' ? message : JSON.stringify(message);
		const encoded = Buffer.from(body).toString('base64');
		const res = await queueClient.sendMessage(encoded);

		// Logging: if configured and logger provided, record envelope
		if (this.options.logging?.enabled && this.options.logger) {
			const envelope: MessageLogEnvelope = {
				queue,
				messageId: (res as unknown as { messageId?: string })?.messageId ?? '',
				payload:
					typeof message === 'string'
						? (() => {
								try {
									return JSON.parse(message as string);
								} catch {
									return message;
								}
							})()
						: message,
				metadata: opts?.loggingTags ? { loggingTags: opts.loggingTags } : {},
				createdAt: new Date().toISOString(),
			};

			const doLog = async () => {
				try {
					await this.options.logger?.logMessage(envelope);
				} catch (e) {
					console.error('[ServiceQueueStorage] logging failed', e);
				}
			};

			if (this.options.logging?.await) await doLog();
			else void doLog();
		}
	}

	public async sendValidatedMessage<T>(queue: string, contract: { encode(payload: T): string }, payload: T, opts?: SendMessageOptions): Promise<void> {
		const encoded = contract.encode(payload);
		await this.sendMessage(queue, encoded, opts);
	}

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

	public async deleteMessage(queue: string, messageId: string, popReceipt: string): Promise<void> {
		const q = this.getQueueClient(queue);
		await q.deleteMessage(messageId, popReceipt);
	}

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
