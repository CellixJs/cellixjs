import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../../../index.ts';
import { getVendorUserRoleUnitOfWork } from './vendor-user-role.uow.ts';

export const VendorUserRolePersistence = (models: ModelsContext, passport: Domain.Passport) => {
	const VendorUserRoleModel = models.VendorUserRole;
	return {
		VendorUserRoleUnitOfWork: getVendorUserRoleUnitOfWork(VendorUserRoleModel, passport),
	};
};