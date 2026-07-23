import type { DomainDataSource } from '../../../index.ts';
import { PassportFactory } from '../../contexts/passport.ts';

export class StaffRoleDeletionRecoveryService {
	async retryDeletedStaffRoles(domainDataSource: DomainDataSource): Promise<number> {
		const systemPassport = PassportFactory.forSystem({
			canManageStaffRolesAndPermissions: true,
			isSystemAccount: true,
		});
		let retriedRoleCount = 0;

		await domainDataSource.User.StaffRole.StaffRoleUnitOfWork.withTransaction(systemPassport, async (repository) => {
			const deletedRoles = await repository.getDeletedRoles();
			retriedRoleCount = deletedRoles.length;
			for (const deletedRole of deletedRoles) {
				deletedRole.retryDelete();
				await repository.save(deletedRole);
			}
		});

		return retriedRoleCount;
	}
}
