import type { QueueStorageOperations } from '@ocom/service-queue-storage';
import { describe, expect, it, vi } from 'vitest';
import { ensureCanViewQueues, registeredQueueOperations } from './queue-operations.ts';

describe('registeredQueueOperations', () => {
	it('includes peek-only poison queue operations for every registered primary queue', async () => {
		const peekMessages = vi.fn().mockResolvedValue([]);
		const queueStorageService = {
			sendMessageToCommunityCreationQueue: vi.fn(),
			peekAtCommunityCreationQueue: vi.fn(),
			peekAtEndUserUpdateQueue: vi.fn(),
			peekMessages,
		} as unknown as QueueStorageOperations;

		const operations = registeredQueueOperations(queueStorageService);

		expect([...operations.keys()]).toEqual(['community-creation', 'end-user-update', 'community-creation-poison', 'end-user-update-poison']);

		await operations.get('community-creation-poison')?.peek(8);

		expect(peekMessages).toHaveBeenCalledWith('community-creation-poison', { maxMessages: 8 });
		expect(operations.get('community-creation-poison')?.send).toBeUndefined();
	});
});

describe('ensureCanViewQueues', () => {
	function makeDataSources(canViewQueues: boolean) {
		return {
			readonlyDataSource: {
				User: {
					StaffUser: {
						StaffUserReadRepo: {
							getByExternalId: vi.fn().mockResolvedValue({
								role: { permissions: { techAdminPermissions: { canViewQueues } } },
							}),
						},
					},
				},
			},
		} as unknown as Parameters<typeof ensureCanViewQueues>[0];
	}

	it('allows a staff user with canViewQueues', async () => {
		await expect(ensureCanViewQueues(makeDataSources(true), 'staff-1')()).resolves.toBeUndefined();
	});

	it('rejects a staff user without canViewQueues', async () => {
		await expect(ensureCanViewQueues(makeDataSources(false), 'staff-1')()).rejects.toThrow('Unauthorized to view queues');
	});
});
