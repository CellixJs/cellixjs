import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineQueue, type ProcessQueueMessageOptions, type QueueMessage, registerQueues } from './index.ts';

interface FakeMessage {
	id: string;
	text: string;
	popReceipt: string;
	dequeueCount: number;
	visibleAt: number;
}

const { queues, counters, createdQueues } = vi.hoisted(() => ({
	queues: new Map<string, FakeMessage[]>(),
	counters: { id: 0, receipt: 0 },
	createdQueues: new Set<string>(),
}));

function notFound(): Error {
	return Object.assign(new Error('The specified message does not exist.'), { statusCode: 404 });
}

vi.mock('@azure/storage-queue', () => {
	const messagesOf = (name: string) => {
		const existing = queues.get(name);
		if (existing) return existing;
		const created: FakeMessage[] = [];
		queues.set(name, created);
		return created;
	};
	const owned = (name: string, id: string, popReceipt: string) => {
		const message = messagesOf(name).find((candidate) => candidate.id === id);
		if (!message || message.popReceipt !== popReceipt) throw notFound();
		return message;
	};
	const queueClient = (name: string) => ({
		createIfNotExists: vi.fn(() => {
			createdQueues.add(name);
			return Promise.resolve({ succeeded: true });
		}),
		sendMessage: vi.fn((text: string, options?: { visibilityTimeout?: number }) => {
			counters.id += 1;
			const id = `msg-${counters.id}`;
			messagesOf(name).push({ id, text, popReceipt: '', dequeueCount: 0, visibleAt: Date.now() + (options?.visibilityTimeout ?? 0) * 1000 });
			return Promise.resolve({ messageId: id });
		}),
		receiveMessages: vi.fn((options?: { numberOfMessages?: number; visibilityTimeout?: number }) => {
			const visible = messagesOf(name)
				.filter((message) => message.visibleAt <= Date.now())
				.slice(0, options?.numberOfMessages ?? 1);
			for (const message of visible) {
				counters.receipt += 1;
				message.dequeueCount += 1;
				message.popReceipt = `receipt-${counters.receipt}`;
				message.visibleAt = Date.now() + (options?.visibilityTimeout ?? 30) * 1000;
			}
			return Promise.resolve({
				receivedMessageItems: visible.map((message) => ({ messageId: message.id, popReceipt: message.popReceipt, messageText: message.text, dequeueCount: message.dequeueCount })),
			});
		}),
		updateMessage: vi.fn((id: string, popReceipt: string, _text: string | undefined, visibilityTimeout: number) => {
			const message = owned(name, id, popReceipt);
			counters.receipt += 1;
			message.popReceipt = `receipt-${counters.receipt}`;
			message.visibleAt = Date.now() + visibilityTimeout * 1000;
			return Promise.resolve({ popReceipt: message.popReceipt });
		}),
		deleteMessage: vi.fn((id: string, popReceipt: string) => {
			owned(name, id, popReceipt);
			queues.set(
				name,
				messagesOf(name).filter((message) => message.id !== id),
			);
			return Promise.resolve({});
		}),
		peekMessages: vi.fn(async () => ({ peekedMessageItems: [] })),
	});
	return {
		QueueServiceClient: {
			fromConnectionString: vi.fn(() => ({ getQueueClient: vi.fn((name: string) => queueClient(name)) })),
		},
	};
});

interface ImportRequest {
	requestId: string;
}

function createRegistry() {
	return registerQueues({
		outbound: {},
		inbound: {
			importRequests: defineQueue<ImportRequest>()({
				queueName: 'import-requests',
				schema: { type: 'object', properties: { requestId: { type: 'string' } }, required: ['requestId'], additionalProperties: false },
			}),
		},
	});
}

type Service = InstanceType<ReturnType<typeof createRegistry>['Service']>;

function enqueue(queueName: string, body: unknown, overrides: Partial<FakeMessage> = {}): string {
	counters.id += 1;
	const id = `msg-${counters.id}`;
	const text = Buffer.from(typeof body === 'string' ? body : JSON.stringify(body)).toString('base64');
	const existing = queues.get(queueName) ?? [];
	existing.push({ id, text, popReceipt: '', dequeueCount: 0, visibleAt: Date.now(), ...overrides });
	queues.set(queueName, existing);
	return id;
}

function messagesIn(queueName: string): FakeMessage[] {
	return queues.get(queueName) ?? [];
}

function decoded(message: FakeMessage | undefined): unknown {
	return message ? JSON.parse(Buffer.from(message.text, 'base64').toString('utf8')) : undefined;
}

describe('processNextFrom<Queue>Queue', () => {
	let service: Service;

	beforeEach(async () => {
		queues.clear();
		counters.id = 0;
		counters.receipt = 0;
		service = new (createRegistry().Service)({ connectionString: 'UseDevelopmentStorage=true' });
		await service.startUp();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('returns empty without calling the handler when no message is visible', async () => {
		const handler = vi.fn();

		await expect(service.processNextFromImportRequestsQueue(handler)).resolves.toEqual({ status: 'empty' });
		expect(handler).not.toHaveBeenCalled();
	});

	it('passes the validated, typed message to the handler and deletes it on success', async () => {
		const id = enqueue('import-requests', { requestId: 'r1' });
		let received: QueueMessage<ImportRequest> | undefined;

		const result = await service.processNextFromImportRequestsQueue((message) => {
			received = message;
			return Promise.resolve();
		});

		expect(result).toEqual({ status: 'completed', messageId: id });
		expect(received).toMatchObject({ id, payload: { requestId: 'r1' }, dequeueCount: 1 });
		expect(messagesIn('import-requests')).toEqual([]);
	});

	it('hides the message from other receivers for the visibility timeout while the handler runs', async () => {
		enqueue('import-requests', { requestId: 'r1' });
		let secondResult: unknown;

		await service.processNextFromImportRequestsQueue(
			async () => {
				secondResult = await service.processNextFromImportRequestsQueue(vi.fn());
			},
			{ visibilityTimeoutSeconds: 120 },
		);

		expect(secondResult).toEqual({ status: 'empty' });
	});

	it('renews visibility on a heartbeat so long handlers keep the message hidden', async () => {
		vi.useFakeTimers();
		const id = enqueue('import-requests', { requestId: 'r1' });
		let release: () => void = () => undefined;

		const processing = service.processNextFromImportRequestsQueue(() => new Promise<void>((resolve) => (release = resolve)), { visibilityTimeoutSeconds: 60, heartbeatIntervalSeconds: 20 });
		await vi.advanceTimersByTimeAsync(10 * 60 * 1000);

		const message = messagesIn('import-requests')[0];
		expect(message?.visibleAt).toBeGreaterThan(Date.now());
		expect(message?.visibleAt).toBeLessThanOrEqual(Date.now() + 60_000);

		release();
		await expect(processing).resolves.toEqual({ status: 'completed', messageId: id });
		expect(messagesIn('import-requests')).toEqual([]);
	});

	it('leaves the message for retry when the handler fails with a transient error', async () => {
		const id = enqueue('import-requests', { requestId: 'r1' });
		const failure = new Error('storage unavailable');

		const result = await service.processNextFromImportRequestsQueue(() => Promise.reject(failure));

		expect(result).toEqual({ status: 'retrying', messageId: id, error: failure });
		expect(messagesIn('import-requests')).toHaveLength(1);
		const retried = await service.processNextFromImportRequestsQueue((message) => {
			expect(message.dequeueCount).toBe(2);
			return Promise.resolve();
		});
		expect(retried.status).toBe('completed');
	});

	it('delays the retry by retryDelaySeconds', async () => {
		vi.useFakeTimers();
		enqueue('import-requests', { requestId: 'r1' });

		await service.processNextFromImportRequestsQueue(() => Promise.reject(new Error('transient')), { retryDelaySeconds: 30 });

		await expect(service.processNextFromImportRequestsQueue(vi.fn())).resolves.toEqual({ status: 'empty' });
		await vi.advanceTimersByTimeAsync(30_000);
		await expect(service.processNextFromImportRequestsQueue(() => Promise.resolve())).resolves.toMatchObject({ status: 'completed' });
	});

	it('moves the message to the poison queue when isPermanentFailure classifies the error as permanent', async () => {
		const id = enqueue('import-requests', { requestId: 'r1' });
		const failure = Object.assign(new Error('source missing'), { code: 'source-not-found' });

		const result = await service.processNextFromImportRequestsQueue(() => Promise.reject(failure), {
			isPermanentFailure: (error) => (error as { code?: string }).code === 'source-not-found',
		});

		expect(result).toEqual({ status: 'poisoned', messageId: id, reason: 'permanent-failure', error: failure });
		expect(messagesIn('import-requests')).toEqual([]);
		expect(decoded(messagesIn('import-requests-poison')[0])).toEqual({ requestId: 'r1' });
	});

	it('moves an invalid payload to the poison queue without calling the handler', async () => {
		const id = enqueue('import-requests', { unexpected: true });
		const handler = vi.fn();

		const result = await service.processNextFromImportRequestsQueue(handler);

		expect(result).toMatchObject({ status: 'poisoned', messageId: id, reason: 'invalid-payload' });
		expect(result.status === 'poisoned' && 'error' in result ? result.error : undefined).toBeInstanceOf(Error);
		expect(handler).not.toHaveBeenCalled();
		expect(decoded(messagesIn('import-requests-poison')[0])).toEqual({ unexpected: true });
	});

	it('moves a message that exceeded maxDequeueCount to the poison queue without calling the handler', async () => {
		const id = enqueue('import-requests', { requestId: 'r1' }, { dequeueCount: 5 });
		const handler = vi.fn();

		const result = await service.processNextFromImportRequestsQueue(handler);

		expect(result).toEqual({ status: 'poisoned', messageId: id, reason: 'max-dequeue-count' });
		expect(handler).not.toHaveBeenCalled();
		expect(messagesIn('import-requests-poison')).toHaveLength(1);
	});

	it('honours a custom maxDequeueCount and poisonQueueName', async () => {
		enqueue('import-requests', { requestId: 'r1' }, { dequeueCount: 1 });

		const result = await service.processNextFromImportRequestsQueue(vi.fn(), { maxDequeueCount: 1, poisonQueueName: 'import-requests-dead' });

		expect(result).toMatchObject({ status: 'poisoned', reason: 'max-dequeue-count' });
		expect(messagesIn('import-requests-dead')).toHaveLength(1);
		expect(messagesIn('import-requests-poison')).toEqual([]);
	});

	it('aborts the handler and reports the message as lost when a heartbeat cannot renew it', async () => {
		vi.useFakeTimers();
		const id = enqueue('import-requests', { requestId: 'r1' });
		let handlerSignal: AbortSignal | undefined;

		const processing = service.processNextFromImportRequestsQueue(
			(_message, { signal }) => {
				handlerSignal = signal;
				return new Promise<void>((_resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason)));
			},
			{ visibilityTimeoutSeconds: 60, heartbeatIntervalSeconds: 20 },
		);
		await vi.advanceTimersByTimeAsync(0);
		const message = messagesIn('import-requests')[0];
		if (message) message.popReceipt = 'stolen-by-another-receiver';
		await vi.advanceTimersByTimeAsync(20_000);

		const result = await processing;
		expect(handlerSignal?.aborted).toBe(true);
		expect(result).toMatchObject({ status: 'lost', messageId: id });
		expect(messagesIn('import-requests')).toHaveLength(1);
	});

	it('aborts the handler and releases the message immediately when the caller aborts', async () => {
		const id = enqueue('import-requests', { requestId: 'r1' });
		const controller = new AbortController();

		const result = await service.processNextFromImportRequestsQueue(
			(_message, { signal }) => {
				controller.abort(new Error('SIGTERM'));
				expect(signal.aborted).toBe(true);
				return Promise.reject(signal.reason);
			},
			{ signal: controller.signal, visibilityTimeoutSeconds: 600 },
		);

		expect(result).toMatchObject({ status: 'retrying', messageId: id });
		await expect(service.processNextFromImportRequestsQueue(() => Promise.resolve())).resolves.toMatchObject({ status: 'completed' });
	});

	it('logs the received message through the inbound logging path', async () => {
		const logMessage = vi.fn(async () => ({ container: 'queue-logs', blobName: 'log.json' }));
		service.enableLogging({ logMessage }, { enabled: true, container: 'queue-logs', await: true });
		const id = enqueue('import-requests', { requestId: 'r1' });

		await service.processNextFromImportRequestsQueue(() => Promise.resolve());

		expect(logMessage).toHaveBeenCalledWith(expect.objectContaining({ queue: 'import-requests', direction: 'inbound', messageId: id, payload: { requestId: 'r1' } }));
	});

	it('rejects options whose heartbeat interval is not shorter than the visibility timeout', async () => {
		enqueue('import-requests', { requestId: 'r1' });
		const options: ProcessQueueMessageOptions = { visibilityTimeoutSeconds: 30, heartbeatIntervalSeconds: 30 };

		await expect(service.processNextFromImportRequestsQueue(vi.fn(), options)).rejects.toThrow('heartbeatIntervalSeconds');
		expect(messagesIn('import-requests')[0]?.dequeueCount).toBe(0);
	});

	it('rejects when the service has not been started', async () => {
		const stopped = new (createRegistry().Service)({ connectionString: 'UseDevelopmentStorage=true' });

		await expect(stopped.processNextFromImportRequestsQueue(vi.fn())).rejects.toThrow('not started');
	});
});

describe('Azurite auto-provisioning', () => {
	beforeEach(() => {
		createdQueues.clear();
	});

	it.each(['127.0.0.1', 'host.docker.internal'])('provisions registered queues for an Azurite endpoint on %s', async (host) => {
		const service = new (createRegistry().Service)({
			connectionString: `DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=test;QueueEndpoint=http://${host}:10001/devstoreaccount1;`,
		});

		await service.startUp();

		expect(createdQueues).toContain('import-requests');
	});

	it('does not provision queues for a non-local endpoint outside development', async () => {
		const service = new (createRegistry().Service)({
			connectionString: 'DefaultEndpointsProtocol=https;AccountName=prod;AccountKey=test;EndpointSuffix=core.windows.net',
		});

		await service.startUp();

		expect(createdQueues.size).toBe(0);
	});
});
