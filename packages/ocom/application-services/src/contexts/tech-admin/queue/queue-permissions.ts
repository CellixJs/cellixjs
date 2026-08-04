import type { DataSources } from '@ocom/persistence';

 // only needed because passport for techadmin is not implemented
export function checkPermissionOnce(checkPermission: () => Promise<void>): () => Promise<void> {
	let permissionCheck: Promise<void> | undefined;

	return (): Promise<void> => {
		permissionCheck ??= checkPermission();
		return permissionCheck;
	};
}

export function checkCanViewQueues(dataSources: DataSources, staffUserExternalId: string | undefined): () => Promise<void> {
	return async (): Promise<void> => {
		if (!staffUserExternalId) throw new Error('Unauthorized to view queues');
		const staffUser = await dataSources.readonlyDataSource.User.StaffUser.StaffUserReadRepo.getByExternalId(staffUserExternalId);
		if (!staffUser?.role?.permissions.techAdminPermissions.canViewQueues) throw new Error('Unauthorized to view queues');
	};
}

export function checkCanSendQueueMessages(dataSources: DataSources, staffUserExternalId: string | undefined): () => Promise<void> {
	return async (): Promise<void> => {
		if (!staffUserExternalId) throw new Error('Unauthorized to send queue messages');
		const staffUser = await dataSources.readonlyDataSource.User.StaffUser.StaffUserReadRepo.getByExternalId(staffUserExternalId);
		if (!staffUser?.role?.permissions.techAdminPermissions.canSendQueueMessages) throw new Error('Unauthorized to send queue messages');
	};
}
