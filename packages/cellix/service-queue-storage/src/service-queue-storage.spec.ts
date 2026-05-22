import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServiceQueueStorage } from './service-queue-storage.js';

vi.mock('@azure/storage-queue', () => {
	return {
		QueueServiceClient: {
			fromConnectionString: vi.fn((_conn: string) => {
				return {
					url: `https://mock.queue.core.windows.net`,
					getQueueClient: vi.fn((_q: string) => ({
						sendMessage: vi.fn(async (_m: string) => ({ messageId: 'mid' })),
						createIfNotExists: vi.fn(async () => ({ succeeded: true })),
						receiveMessages: vi.fn(async () => ({ receivedMessageItems: [] })),
						peekMessages: vi.fn(async () => ({ peekedMessageItems: [] })),
						deleteMessage: vi.fn(async () => ({})),
					})),
				};
			}),
		},
	};
});

vi.mock('@azure/identity', () => {
	return { DefaultAzureCredential: vi.fn() };
});

describe('ServiceQueueStorage', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('startUp with connectionString uses fromConnectionString', async () => {
		const svc = new ServiceQueueStorage({ connectionString: 'UseDevelopmentStorage=true' });
		await expect(svc.startUp()).resolves.toBe(svc);
	});

	it('sendMessage calls underlying queue client sendMessage and logging optional', async () => {
		const svc = new ServiceQueueStorage({ connectionString: 'UseDevelopmentStorage=true', logging: { enabled: false, container: 'x' } });
		await svc.startUp();

		// sendMessage should not throw
		await expect(svc.sendMessage('q', { hello: 'world' })).resolves.toBeUndefined();
	});

	it('createQueueIfNotExists does not throw for missing queue', async () => {
		const svc = new ServiceQueueStorage({ connectionString: 'UseDevelopmentStorage=true' });
		await svc.startUp();
		await expect(svc.createQueueIfNotExists('some-queue')).resolves.toBeUndefined();
	});
});
