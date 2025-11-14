import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export interface StaffRoleQueryByIdCommand {
	roleId: string;
}

const isNotFoundError = (error: unknown): boolean => {
	return (
		error instanceof Error &&
		(error.name === 'NotFoundError' ||
			error.message.toLowerCase().includes('not found'))
	);
};

export const queryById = (dataSources: DataSources) => {
	return async (
		command: StaffRoleQueryByIdCommand,
	): Promise<Domain.User.StaffRole.StaffRoleEntityReference | null> => {
		let staffRole:
			| Domain.User.StaffRole.StaffRoleEntityReference
			| null = null;
		try {
			await dataSources.domainDataSource.User.StaffRole.StaffRoleUnitOfWork.withScopedTransaction(
				async (repository) => {
					staffRole = await repository.getById(command.roleId);
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
