import { randomUUID } from 'node:crypto';
import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export interface StaffUserCreateCommand {
	externalId?: string;
	firstName: string;
	lastName: string;
	email: string;
	roleId?: string | null;
}

export const create = (dataSources: DataSources) => {
	return async (command: StaffUserCreateCommand): Promise<Domain.Contexts.User.StaffUser.StaffUserEntityReference> => {
		if (command.externalId) {
			const existing = await dataSources.readonlyDataSource.User.StaffUser.StaffUserReadRepo.getByExternalId(command.externalId);
			if (existing) {
				throw new Error(`Staff user with externalId ${command.externalId} already exists`);
			}
		}
		if (command.email) {
			const existingByEmail = await dataSources.readonlyDataSource.User.StaffUser.StaffUserReadRepo.getByEmail(command.email);
			if (existingByEmail) {
				throw new Error(`Staff user with email ${command.email} already exists`);
			}
		}

		let role: Domain.Contexts.User.StaffRole.StaffRoleEntityReference | null = null;
		const roleId = command.roleId ?? undefined;
		if (roleId) {
			await dataSources.domainDataSource.User.StaffRole.StaffRoleUnitOfWork.withScopedTransaction(async (repo) => {
				role = await repo.getById(roleId);
			});
		}

		const externalId = command.externalId ?? randomUUID();
		let createdUser: Domain.Contexts.User.StaffUser.StaffUserEntityReference | undefined;
		await dataSources.domainDataSource.User.StaffUser.StaffUserUnitOfWork.withScopedTransaction(async (repo) => {
			const newUser = await repo.getNewInstance(externalId, command.firstName, command.lastName, command.email);
			if (role) {
				newUser.role = role;
			}
			createdUser = await repo.save(newUser);
		});

		if (!createdUser) {
			throw new Error('Unable to create staff user');
		}

		return createdUser;
	};
};
