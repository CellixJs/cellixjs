import { describe, expect, it, vi } from 'vitest';
import { BlobQueueMessageLogger } from './index.js';

type MockBlob = { uploadText: (req: { containerName: string; blobName: string; text: string; metadata?: Record<string, string>; tags?: Record<string, string> }) => Promise<unknown> };

describe('BlobQueueMessageLogger', () => {
	it('is exported and constructable', () => {
		const mockBlob: MockBlob = { uploadText: async () => ({}) };
		const logger = new BlobQueueMessageLogger(mockBlob, 'c');
		expect(typeof logger.logMessage).toBe('function');
	});

	it('passes metadata and tags to uploadText', async () => {
		const uploadSpy = vi.fn().mockResolvedValue({});
		const mockBlob: MockBlob = { uploadText: uploadSpy };
		const logger = new BlobQueueMessageLogger(mockBlob, 'my-container');

		await logger.logMessage({
			queue: 'test-queue',
			direction: 'outbound',
			messageId: 'msg-1',
			payload: { externalId: 'ext-123' },
			metadata: { createdBy: 'system' },
			tags: { externalId: 'ext-123' },
			createdAt: '2026-01-01T00:00:00.000Z',
		});

		expect(uploadSpy).toHaveBeenCalledOnce();
		const req = uploadSpy.mock.calls[0][0];
		expect(req.containerName).toBe('my-container');
		expect(req.blobName).toBe('outbound/2026-01-01T00:00:00.000Z.json');
		expect(req.text).toBe(JSON.stringify({ externalId: 'ext-123' }, null, 2));
		expect(req.metadata).toEqual({ createdBy: 'system' });
		expect(req.tags).toEqual({ externalId: 'ext-123', queueName: 'test-queue' });
	});

	it('omits metadata and tags when not provided', async () => {
		const uploadSpy = vi.fn().mockResolvedValue({});
		const mockBlob: MockBlob = { uploadText: uploadSpy };
		const logger = new BlobQueueMessageLogger(mockBlob, 'c');

		await logger.logMessage({ queue: 'q', direction: 'inbound', messageId: 'id-1', payload: { x: 1 } });

		const req = uploadSpy.mock.calls[0][0];
		expect(req.metadata).toBeUndefined();
		expect(req.tags).toEqual({ queueName: 'q' });
	});
});
