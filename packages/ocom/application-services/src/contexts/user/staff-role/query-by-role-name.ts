import type { DataSources } from '@ocom/persistence';
import type * as StaffRole from '@ocom/domain/contexts/staff-role';

export interface StaffRoleQueryByRoleNameCommand {
	roleName: string;
}

const isNotFoundError = (error: unknown): boolean => {
	return (
		error instanceof Error &&
		(error.name === 'NotFoundError' ||
			error.message.toLowerCase().includes('not found'))
	);
};

export const queryByRoleName = (dataSources: DataSources) => {
	return async (
		command: StaffRoleQueryByRoleNameCommand,
	): Promise<StaffRole.StaffRoleEntityReference | null> => {
		let staffRole:
			| StaffRole.StaffRoleEntityReference
			| null = null;
		try {
			await dataSources.domainDataSource.User.StaffRole.StaffRoleUnitOfWork.withScopedTransaction(
				async (repository) => {
					staffRole = await repository.getByRoleName(
						command.roleName,
					);
				},
			);
		} catch (error) {
			if (isNotFoundError(error)) {
				return null;
			}
			throw error;
		}
		return staffRole;
	};
};
