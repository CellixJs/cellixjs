import type { QueueStorageOperations } from '@ocom/service-queue-storage';
import { describe, expect, it, vi } from 'vitest';
import { getQueueMessageCount } from './get-queue-message-count.ts';

describe('getQueueMessageCount', () => {
	it('returns a queue-specific error when the physical queue is missing', async () => {
		const checkPermission = vi.fn().mockResolvedValue(undefined);
		const queueStorageService = {
			getCommunityCreationQueueMessageCount: vi.fn().mockRejectedValue(new Error('The specified queue does not exist.')),
		} as unknown as QueueStorageOperations;

		await expect(getQueueMessageCount(queueStorageService, checkPermission)({ queueName: 'community-creation' })).resolves.toEqual({
			errorMessage: 'The specified queue does not exist.',
		});
		expect(checkPermission).toHaveBeenCalledOnce();
	});
});
