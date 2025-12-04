import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../../../index.ts';
import { getEndUserRoleUnitOfWork } from './end-user-role.uow.ts';

export type EndUserRoleReturnType = {
	EndUserRoleUnitOfWork: Domain.Contexts.Community.Role.EndUserRole.EndUserRoleUnitOfWork;
};

type EndUserRolePersistenceType = (
	models: ModelsContext,
	passport: Domain.Passport,
) => EndUserRoleReturnType;

export const EndUserRolePersistence: EndUserRolePersistenceType = (models: ModelsContext, passport: Domain.Passport) => {
	const EndUserRoleModel = models.EndUserRole;
	return {
		EndUserRoleUnitOfWork: getEndUserRoleUnitOfWork(EndUserRoleModel, passport),
	};
};
