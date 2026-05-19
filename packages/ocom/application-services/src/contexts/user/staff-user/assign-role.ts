import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export interface StaffUserAssignRoleCommand {
	staffUserId: string;
	roleId: string;
}

export const assignRole = (dataSources: DataSources) => {
	return async (command: StaffUserAssignRoleCommand): Promise<Domain.Contexts.User.StaffUser.StaffUserEntityReference> => {
		let result: Domain.Contexts.User.StaffUser.StaffUserEntityReference | undefined;

		await dataSources.domainDataSource.User.StaffUser.StaffUserUnitOfWork.withScopedTransaction(async (staffUserRepo) => {
			const staffUser = await staffUserRepo.get(command.staffUserId);

			let role: Domain.Contexts.User.StaffRole.StaffRoleEntityReference | null = null;
			await dataSources.domainDataSource.User.StaffRole.StaffRoleUnitOfWork.withScopedTransaction(async (staffRoleRepo) => {
				role = await staffRoleRepo.getById(command.roleId);
			});

			if (!role) {
				throw new Error(`StaffRole with id ${command.roleId} not found`);
			}

			staffUser.role = role;
			result = await staffUserRepo.save(staffUser);
		});

		if (!result) {
			throw new Error('Unable to assign role to staff user');
		}

		return result;
	};
};
