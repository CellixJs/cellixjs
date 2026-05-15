import type { Domain } from '@ocom/domain';
import { Domain as DomainRuntime } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { createDefaultRoles } from '../staff-role/create-default-roles.ts';

export interface StaffUserCreateIfNotExistsCommand {
	externalId: string;
	firstName: string;
	lastName: string;
	email: string;
	aadRoles: string[];
}

const isNotFoundError = (error: unknown): error is Error => {
	return error instanceof Error && (error.name === 'NotFoundError' || error.message.toLowerCase().includes('not found'));
};

const getDefaultRoleByHighestPriorityEnterpriseAppRole = async (
	dataSources: DataSources,
	aadRoles: string[],
): Promise<Domain.Contexts.User.StaffRole.StaffRoleEntityReference | null> => {
	let found: Domain.Contexts.User.StaffRole.StaffRoleEntityReference | null = null;
	await dataSources.domainDataSource.User.StaffRole.StaffRoleUnitOfWork.withScopedTransaction(async (repo) => {
		for (const aadRole of aadRoles) {
			try {
				found = await repo.getDefaultRoleByEnterpriseAppRole(aadRole);
				return;
			} catch (error) {
				if (isNotFoundError(error)) {
					continue;
				}
				throw error;
			}
		}
	});
	return found;
};

export const createIfNotExists = (dataSources: DataSources) => {
	return async (command: StaffUserCreateIfNotExistsCommand): Promise<Domain.Contexts.User.StaffUser.StaffUserEntityReference> => {
		const existing = await dataSources.readonlyDataSource.User.StaffUser.StaffUserReadRepo.getByExternalId(command.externalId);
		if (existing) {
			return existing;
		}

		// Ensure the 4 default roles exist before creating the user
		await createDefaultRoles(dataSources)();

		const matchingRole = await getDefaultRoleByHighestPriorityEnterpriseAppRole(dataSources, command.aadRoles);

		let createdUser: Domain.Contexts.User.StaffUser.StaffUserEntityReference | undefined;

		await dataSources.domainDataSource.User.StaffUser.StaffUserUnitOfWork.withTransaction(DomainRuntime.PassportFactory.forSystem({ canManageStaffRolesAndPermissions: true }), async (repository) => {
			const newUser = await repository.getNewInstance(command.externalId, command.firstName, command.lastName, command.email);

			if (matchingRole) {
				newUser.role = matchingRole;
			}

			createdUser = await repository.save(newUser);
		});

		if (!createdUser) {
			throw new Error('Unable to create staff user');
		}

		return createdUser;
	};
};
