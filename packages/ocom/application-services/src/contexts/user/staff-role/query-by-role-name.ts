import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

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
	): Promise<Domain.User.StaffRole.StaffRoleEntityReference | null> => {
		let staffRole:
			| Domain.User.StaffRole.StaffRoleEntityReference
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
