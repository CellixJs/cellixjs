import type { DataSources } from '@ocom/persistence';
import type { StaffRoleEntityReference, StaffRoleUnitOfWork } from '@ocom/domain/contexts/staff-role';

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
	): Promise<StaffRoleEntityReference | null> => {
		let staffRole:
			| StaffRoleEntityReference
			| null = null;
		try {
			await dataSources.domainDataSource.User.StaffRoleUnitOfWork.withScopedTransaction(
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
