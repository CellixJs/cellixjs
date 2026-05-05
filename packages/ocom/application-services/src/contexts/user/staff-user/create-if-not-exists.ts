import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { createDefaultRoles, type StaffAppRoleName, StaffAppRoleNames } from '../staff-role/create-default-roles.ts';

export interface StaffUserCreateIfNotExistsCommand {
	externalId: string;
	firstName: string;
	lastName: string;
	email: string;
	aadRoles: string[];
}

const findMatchingRoleName = (aadRoles: string[]): StaffAppRoleName | undefined => {
	const knownRoles = Object.values(StaffAppRoleNames) as StaffAppRoleName[];
	return aadRoles.find((r): r is StaffAppRoleName => knownRoles.includes(r as StaffAppRoleName));
};

const getRoleByName = async (dataSources: DataSources, roleName: string): Promise<Domain.Contexts.User.StaffRole.StaffRoleEntityReference | null> => {
	let found: Domain.Contexts.User.StaffRole.StaffRoleEntityReference | null = null;
	await dataSources.domainDataSource.User.StaffRole.StaffRoleUnitOfWork.withScopedTransaction(async (repo) => {
		try {
			found = await repo.getByRoleName(roleName);
		} catch {
			found = null;
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

		// Find which default role matches the user's AAD roles
		const matchingRoleName = findMatchingRoleName(command.aadRoles);
		const matchingRole = matchingRoleName ? await getRoleByName(dataSources, matchingRoleName) : null;

		let createdUser: Domain.Contexts.User.StaffUser.StaffUserEntityReference | undefined;

		await dataSources.domainDataSource.User.StaffUser.StaffUserUnitOfWork.withScopedTransaction(async (repository) => {
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
