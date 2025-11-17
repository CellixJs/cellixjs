import type { ModelsContext } from '../../../../../index.ts';
import { getEndUserRoleUnitOfWork } from './end-user-role.uow.ts';
import type { Passport } from '@ocom/domain/contexts/passport';

export const EndUserRolePersistence = (models: ModelsContext, passport: Passport) => {
	const EndUserRoleModel = models.Role.EndUserRole;
	return {
		EndUserRoleUnitOfWork: getEndUserRoleUnitOfWork(EndUserRoleModel, passport),
	};
};
