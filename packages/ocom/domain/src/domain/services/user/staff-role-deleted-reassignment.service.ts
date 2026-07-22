import type { DomainDataSource } from '../../../index.ts';
import { PassportFactory } from '../../contexts/passport.ts';
import type * as StaffRole from '../../contexts/user/staff-role/index.ts';

const REASSIGNMENT_BATCH_SIZE = 10;

export class StaffRoleDeletedReassignmentService {
	/**
	 * Reassigns every staff user assigned to a deleted staff role to the
	 * default staff role recorded on the deleted role's tombstone.
	 *
	 * Idempotent: the repository selects only users whose stored role reference
	 * still points at the deleted role, so re-processing causes no changes.
	 *
	 * @throws when the recorded replacement role cannot be resolved. The
	 * deletion remains pending so a later retry can continue safely.
	 */
	async reassignStaffUsersToDefaultRole(deletedRoleId: string, actorStaffUserId: string, domainDataSource: DomainDataSource): Promise<void> {
		const resolution: { replacementRole?: StaffRole.StaffRoleEntityReference } = {};
		try {
			await domainDataSource.User.StaffRole.StaffRoleUnitOfWork.withScopedTransaction(async (repo) => {
				resolution.replacementRole = await repo.getReplacementRoleForDeletion(deletedRoleId);
			});
		} catch (error) {
			console.error(`No replacement staff role found while reassigning staff users from deleted role ${deletedRoleId}`, error);
			throw error;
		}
		const resolvedReplacementRole = resolution.replacementRole;
		if (!resolvedReplacementRole) {
			const message = `No replacement staff role found while reassigning staff users from deleted role ${deletedRoleId}`;
			console.error(message);
			throw new Error(message);
		}

		const systemPassport = PassportFactory.forSystem({
			canManageStaffRolesAndPermissions: true,
		});
		let reassignedCount: number;
		do {
			const batchResult: { count?: number } = {};
			await domainDataSource.User.StaffUser.StaffUserUnitOfWork.withTransaction(systemPassport, async (repo) => {
				const assignedStaffUsers = await repo.getAssignedToRoleBatch(deletedRoleId, REASSIGNMENT_BATCH_SIZE);
				for (const staffUser of assignedStaffUsers) {
					staffUser.requestRoleAssignment(resolvedReplacementRole, `Reassigned to default role ${resolvedReplacementRole.roleName} after previous role was deleted`, actorStaffUserId);
					await repo.save(staffUser);
				}
				batchResult.count = assignedStaffUsers.length;
			});
			reassignedCount = batchResult.count ?? 0;
		} while (reassignedCount > 0);
	}
}
