import type { DataSources } from '@ocom/persistence';
import { describe, expect, it, vi } from 'vitest';
import { checkCanSendQueueMessages, checkCanViewQueues, checkPermissionOnce } from './queue-permissions.ts';

function makeDataSources(canViewQueues: boolean, canSendQueueMessages: boolean): DataSources {
	return {
		readonlyDataSource: {
			User: {
				StaffUser: {
					StaffUserReadRepo: {
						getByExternalId: vi.fn().mockResolvedValue({
							role: { permissions: { techAdminPermissions: { canViewQueues, canSendQueueMessages } } },
						}),
					},
				},
			},
		},
	} as unknown as DataSources;
}

describe('queue permissions', () => {
	it('runs a permission check once for concurrent calls', async () => {
		const permissionCheck = vi.fn().mockResolvedValue(undefined);
		const checkPermission = checkPermissionOnce(permissionCheck);

		await Promise.all([checkPermission(), checkPermission(), checkPermission(), checkPermission()]);

		expect(permissionCheck).toHaveBeenCalledOnce();
	});

	it('allows a staff user with queue-view permission', async () => {
		await expect(checkCanViewQueues(makeDataSources(true, false), 'staff-1')()).resolves.toBeUndefined();
	});

	it('rejects a staff user without queue-send permission', async () => {
		await expect(checkCanSendQueueMessages(makeDataSources(true, false), 'staff-1')()).rejects.toThrow('Unauthorized to send queue messages');
	});
});
