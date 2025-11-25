import type { DomainDataSource, Passport } from '@ocom/domain';
import type { ModelsContext } from '../../../../../index.ts';
import { getEndUserRoleUnitOfWork } from './end-user-role.uow.ts';

export const EndUserRolePersistence = (models: ModelsContext, passport: Passport) => {
	const EndUserRoleModel = models.EndUserRole;
	return {
		EndUserRoleUnitOfWork: getEndUserRoleUnitOfWork(EndUserRoleModel, passport),
	};
};
