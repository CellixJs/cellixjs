import type { DomainDataSource } from '../../../index.ts';
import { PassportFactory } from '../../contexts/passport.ts';

export class StaffRoleDeletionRecoveryService {
	async retryDeletedStaffRole(roleId: string, domainDataSource: DomainDataSource): Promise<boolean> {
		const systemPassport = this.createSystemPassport();
		let retried = false;

		await domainDataSource.User.StaffRole.StaffRoleUnitOfWork.withTransaction(systemPassport, async (repository) => {
			const role = await repository.getById(roleId);
			if (!role.deletion) {
				return;
			}
			role.retryDelete();
			await repository.save(role);
			retried = true;
		});

		return retried;
	}

	async retryDeletedStaffRoles(domainDataSource: DomainDataSource): Promise<number> {
		const systemPassport = this.createSystemPassport();
		let deletedRoles: StaffRoleRecoveryState[] = [];

		await domainDataSource.User.StaffRole.StaffRoleUnitOfWork.withTransaction(systemPassport, async (repository) => {
			deletedRoles = (await repository.getDeletedRoles()).map((role) => ({
				id: role.id,
				reassignmentCompleted: role.deletion?.reassignmentCompletedAt !== undefined,
			}));
		});

		if (deletedRoles.length === 0) {
			return 0;
		}

		let assignedDeletedRoleIds: string[] = [];
		await domainDataSource.User.StaffUser.StaffUserUnitOfWork.withTransaction(systemPassport, async (repository) => {
			assignedDeletedRoleIds = await repository.getAssignedRoleIds(deletedRoles.map(({ id }) => id));
		});
		const assignedDeletedRoleIdSet = new Set(assignedDeletedRoleIds);
		const roleIdsToRetry = deletedRoles.filter(({ id, reassignmentCompleted }) => !reassignmentCompleted || assignedDeletedRoleIdSet.has(id)).map(({ id }) => id);

		if (roleIdsToRetry.length === 0) {
			return 0;
		}

		let retriedRoleCount = 0;
		await domainDataSource.User.StaffRole.StaffRoleUnitOfWork.withTransaction(systemPassport, async (repository) => {
			for (const roleId of roleIdsToRetry) {
				const deletedRole = await repository.getById(roleId);
				if (!deletedRole.deletion) {
					continue;
				}
				deletedRole.retryDelete();
				await repository.save(deletedRole);
				retriedRoleCount += 1;
			}
		});

		return retriedRoleCount;
	}

	private createSystemPassport() {
		return PassportFactory.forSystem({
			canManageStaffRolesAndPermissions: true,
			isSystemAccount: true,
		});
	}
}

interface StaffRoleRecoveryState {
	id: string;
	reassignmentCompleted: boolean;
}
