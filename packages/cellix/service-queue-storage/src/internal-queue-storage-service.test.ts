import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InternalQueueStorageService } from './internal-queue-storage-service.ts';
import type { IQueueMessageLogger } from './logging.ts';

const { fromConnectionStringMock, queueServiceClientConstructorMock, defaultAzureCredentialMock } = vi.hoisted(() => ({
	fromConnectionStringMock: vi.fn(),
	queueServiceClientConstructorMock: vi.fn(),
	defaultAzureCredentialMock: vi.fn(),
}));

vi.mock('@azure/storage-queue', () => {
	class MockQueueServiceClient {
		constructor(url: string, credential: unknown) {
			Object.assign(this, queueServiceClientConstructorMock(url, credential));
		}

		static fromConnectionString(connectionString: string) {
			return fromConnectionStringMock(connectionString);
		}
	}

	return {
		QueueServiceClient: MockQueueServiceClient,
	};
});

vi.mock('@azure/identity', () => {
	return {
		DefaultAzureCredential: class MockDefaultAzureCredential {
			constructor() {
				defaultAzureCredentialMock();
			}
		},
	};
});

describe('InternalQueueStorageService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		const createServiceClient = () => ({
			url: 'https://mock.queue.core.windows.net',
			getQueueClient: vi.fn((_q: string) => ({
				sendMessage: vi.fn(async (_m: string) => ({ messageId: 'mid' })),
				createIfNotExists: vi.fn(async () => ({ succeeded: true })),
				receiveMessages: vi.fn(async () => ({ receivedMessageItems: [] })),
				peekMessages: vi.fn(async () => ({ peekedMessageItems: [] })),
				deleteMessage: vi.fn(async () => ({})),
			})),
		});
		fromConnectionStringMock.mockImplementation((_conn: string) => createServiceClient());
		queueServiceClientConstructorMock.mockImplementation((_url: string, _credential: unknown) => createServiceClient());
	});

	it('startUp with connectionString uses fromConnectionString', async () => {
		const svc = new InternalQueueStorageService({ connectionString: 'UseDevelopmentStorage=true' });
		await expect(svc.startUp()).resolves.toBe(svc);
		expect(fromConnectionStringMock).toHaveBeenCalledWith('UseDevelopmentStorage=true');
	});

	it('startUp with accountName and credential uses the injected credential', async () => {
		const credential = { getToken: vi.fn() };
		const svc = new InternalQueueStorageService({
			accountName: 'test-account',
			credential,
		});

		await expect(svc.startUp()).resolves.toBe(svc);

		expect(queueServiceClientConstructorMock).toHaveBeenCalledWith(
			'https://test-account.queue.core.windows.net',
			credential,
		);
		expect(defaultAzureCredentialMock).not.toHaveBeenCalled();
	});

	it('sendMessage calls underlying queue client sendMessage and logging optional', async () => {
		const svc = new InternalQueueStorageService({ connectionString: 'UseDevelopmentStorage=true', logging: { enabled: false, container: 'x' } });
		await svc.startUp();

		// sendMessage should not throw
		await expect(svc.sendMessage('q', { hello: 'world' })).resolves.toBeUndefined();
	});

	it('createQueueIfNotExists does not throw for missing queue', async () => {
		const svc = new InternalQueueStorageService({ connectionString: 'UseDevelopmentStorage=true' });
		await svc.startUp();
		await expect(svc.createQueueIfNotExists('some-queue')).resolves.toBeUndefined();
	});

	it('logs outbound messages when logging is enabled after startUp', async () => {
		const logSpy = vi.fn().mockResolvedValue({ container: 'logs', blobName: 'outbound/msg.json' });
		const logger: IQueueMessageLogger = { logMessage: logSpy as IQueueMessageLogger['logMessage'] };
		const svc = new InternalQueueStorageService({ connectionString: 'UseDevelopmentStorage=true' });

		await svc.startUp();
		svc.enableLogging(logger, { enabled: true, container: 'logs' });
		await svc.sendMessage('q', { hello: 'world' });

		expect(logSpy).toHaveBeenCalledOnce();
		expect(logSpy.mock.calls[0]?.[0]).toMatchObject({
			queue: 'q',
			direction: 'outbound',
			payload: { hello: 'world' },
			tags: { queueName: 'q' },
		});
	});
});
