import type { ModelsContext } from '../../../../../index.ts';
import { getVendorUserRoleUnitOfWork } from './vendor-user-role.uow.ts';
import type { Passport } from '@ocom/domain/contexts/passport';

export const VendorUserRolePersistence = (models: ModelsContext, passport: Passport) => {
	const VendorUserRoleModel = models.Role.VendorUserRole;
	return {
		VendorUserRoleUnitOfWork: getVendorUserRoleUnitOfWork(VendorUserRoleModel, passport),
	};
};