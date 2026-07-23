import type { DomainDataSource } from '../../../index.ts';
import { PassportFactory } from '../../contexts/passport.ts';
import type * as StaffRole from '../../contexts/user/staff-role/index.ts';
import * as StaffUser from '../../contexts/user/staff-user/index.ts';

export class StaffRoleDeletedReassignmentService {
	/**
	 * Reassigns every staff user assigned to a deleted staff role to the
	 * default staff role whose enterpriseAppRole matches the deleted role's.
	 *
	 * Idempotent: staff users already assigned to the matching default role
	 * are skipped, so re-processing the same event causes no changes.
	 *
	 * @throws when no default staff role matches the deleted role's
	 * enterpriseAppRole — the failure is logged and rethrown so the event is
	 * observed as a processing failure instead of silently stranding users.
	 */
	async reassignStaffUsersToDefaultRole(deletedRoleId: string, enterpriseAppRole: string, actorStaffUserId: string, domainDataSource: DomainDataSource): Promise<void> {
		let defaultRole: StaffRole.StaffRoleEntityReference | null = null;
		try {
			await domainDataSource.User.StaffRole.StaffRoleUnitOfWork.withScopedTransaction(async (repo) => {
				defaultRole = await repo.getDefaultRoleByEnterpriseAppRole(enterpriseAppRole);
			});
		} catch (error) {
			console.error(`No default staff role found for enterprise app role "${enterpriseAppRole}" while reassigning staff users from deleted role ${deletedRoleId}`, error);
			throw error;
		}
		if (!defaultRole) {
			const message = `No default staff role found for enterprise app role "${enterpriseAppRole}" while reassigning staff users from deleted role ${deletedRoleId}`;
			console.error(message);
			throw new Error(message);
		}
		const matchingDefaultRole = defaultRole as StaffRole.StaffRoleEntityReference;

		const systemPassport = PassportFactory.forSystem({
			canManageStaffRolesAndPermissions: true,
		});
		await domainDataSource.User.StaffUser.StaffUserUnitOfWork.withTransaction(systemPassport, async (repo) => {
			const assignedStaffUsers = await repo.getAllAssignedToRole(deletedRoleId);
			for (const staffUser of assignedStaffUsers) {
				await repo.setRoleIfCurrent({
					staffUserId: staffUser.id,
					expectedCurrentRoleId: deletedRoleId,
					replacementRoleId: matchingDefaultRole.id,
					activityType: StaffUser.StaffUserActivityLogValueObjects.ActivityTypeCodes.RoleAssigned,
					activityDescription: `Reassigned to default role ${matchingDefaultRole.roleName} after previous role was deleted`,
					activityByStaffUserId: actorStaffUserId,
				});
			}
		});
	}
}
