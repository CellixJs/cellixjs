import { describe, expect, it, vi } from 'vitest';
import { registerQueues } from './index.ts';

vi.mock('@azure/storage-queue', () => ({
	QueueServiceClient: {
		fromConnectionString: vi.fn(() => ({
			getQueueClient: vi.fn(() => ({
				sendMessage: vi.fn(async () => ({ messageId: 'msg-1' })),
				createIfNotExists: vi.fn(async () => ({ succeeded: true })),
				receiveMessages: vi.fn(async () => ({ receivedMessageItems: [] })),
				peekMessages: vi.fn(async () => ({ peekedMessageItems: [] })),
				deleteMessage: vi.fn(async () => ({})),
			})),
		})),
	},
}));

describe('blob-backed queue logging', () => {
	it('adapts blob storage passed to enableLogging into queue message uploads', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
		const uploadText = vi.fn().mockResolvedValue({});
		const registry = registerQueues({
			outbound: {
				externalUpdates: {
					queueName: 'external-updates',
					schema: { type: 'object', properties: { externalId: { type: 'string' } }, required: ['externalId'] },
					loggingTags: { domain: 'external' },
					loggingMetadata: { source: 'system' },
				},
			},
			inbound: {},
		});
		const service = new registry.Service({ connectionString: 'UseDevelopmentStorage=true' });

		service.enableLogging(
			{ uploadText },
			{ enabled: true, container: 'queue-logs' },
		);
		await service.startUp();
		await service.sendMessageToExternalUpdatesQueue({ externalId: 'ext-123' });

		expect(uploadText).toHaveBeenCalledOnce();
		expect(uploadText.mock.calls[0]?.[0]).toEqual({
			containerName: 'queue-logs',
			blobName: 'outbound/2026-01-01T00:00:00.000Z.json',
			text: JSON.stringify({ externalId: 'ext-123' }, null, 2),
			metadata: { source: 'system' },
			tags: { domain: 'external', queueName: 'external-updates' },
		});
		vi.useRealTimers();
	});

	it('uses logging defaults from registerQueues when enableLogging is called without config', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-01-02T00:00:00.000Z'));
		const uploadText = vi.fn().mockResolvedValue({});
		const registry = registerQueues({
			outbound: {
				externalUpdates: {
					queueName: 'external-updates',
					schema: { type: 'object', properties: { externalId: { type: 'string' } }, required: ['externalId'] },
				},
			},
			inbound: {},
			serviceDefaults: {
				logging: {
					enabled: true,
					container: 'queue-logs',
				},
			},
		});
		const service = new registry.Service({ connectionString: 'UseDevelopmentStorage=true' });

		service.enableLogging({ uploadText });
		await service.startUp();
		await service.sendMessageToExternalUpdatesQueue({ externalId: 'ext-456' });

		expect(uploadText).toHaveBeenCalledOnce();
		expect(uploadText.mock.calls[0]?.[0]).toMatchObject({
			containerName: 'queue-logs',
			blobName: 'outbound/2026-01-02T00:00:00.000Z.json',
		});
		vi.useRealTimers();
	});
});
