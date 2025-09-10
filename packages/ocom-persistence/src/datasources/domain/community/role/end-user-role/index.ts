import type { Domain } from '@ocom/api-domain';
import type { ModelsContext } from '../../../../../index.ts';
import { getEndUserRoleUnitOfWork } from './end-user-role.uow.ts';

export const EndUserRolePersistence = (models: ModelsContext, passport: Domain.Passport) => {
	const EndUserRoleModel = models.Community.EndUserRole;
	return {
		EndUserRoleUnitOfWork: getEndUserRoleUnitOfWork(EndUserRoleModel, passport),
	};
};
