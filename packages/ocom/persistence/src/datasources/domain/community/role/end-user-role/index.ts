import type { Domain } from '@ocom/domain';
import type { ModelsContext, PersistenceFactory } from '../../../../../types.ts';
import { getEndUserRoleUnitOfWork } from './end-user-role.uow.ts';

export type EndUserRoleReturnType = {
	EndUserRoleUnitOfWork: Domain.Contexts.Community.Role.EndUserRole.EndUserRoleUnitOfWork;
};

type EndUserRolePersistenceType = PersistenceFactory<EndUserRoleReturnType>;

export const EndUserRolePersistence: EndUserRolePersistenceType = (models: ModelsContext, passport: Domain.Passport) => {
	const EndUserRoleModel = models.EndUserRole;
	return {
		EndUserRoleUnitOfWork: getEndUserRoleUnitOfWork(EndUserRoleModel, passport),
	};
};
