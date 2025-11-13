import type { Passport } from '@ocom/domain';
import type { ModelsContext } from '../../../../../index.ts';
import { getEndUserRoleUnitOfWork } from './end-user-role.uow.ts';

import { EndUserRole } from '@ocom/domain/contexts/community/role/end-user-role';
export const EndUserRolePersistence = (models: ModelsContext, passport: Passport) => {
	const EndUserRoleModel = models.Role.EndUserRole;
	return {
		EndUserRoleUnitOfWork: getEndUserRoleUnitOfWork(EndUserRoleModel, passport),
	};
};
