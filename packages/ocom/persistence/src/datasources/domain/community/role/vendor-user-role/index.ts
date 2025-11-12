import type { Passport } from '@ocom/domain';
import type { ModelsContext } from '../../../../../index.ts';
import { getVendorUserRoleUnitOfWork } from './vendor-user-role.uow.ts';

export const VendorUserRolePersistence = (models: ModelsContext, passport: Passport) => {
	const VendorUserRoleModel = models.Role.VendorUserRole;
	return {
		VendorUserRoleUnitOfWork: getVendorUserRoleUnitOfWork(VendorUserRoleModel, passport),
	};
};