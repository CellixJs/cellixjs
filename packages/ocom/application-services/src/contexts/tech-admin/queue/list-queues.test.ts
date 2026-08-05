import { describe, expect, it, vi } from 'vitest';
import { listQueues } from './list-queues.ts';

describe('listQueues', () => {
	it('returns every centralized queue after authorization', async () => {
		const checkPermission = vi.fn().mockResolvedValue(undefined);

		await expect(listQueues(checkPermission)()).resolves.toEqual([{ name: 'community-creation' }, { name: 'community-creation-poison' }, { name: 'end-user-update' }, { name: 'end-user-update-poison' }]);
		expect(checkPermission).toHaveBeenCalledOnce();
	});
});
