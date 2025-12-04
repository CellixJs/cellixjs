import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../../../index.ts';
import { getVendorUserRoleUnitOfWork } from './vendor-user-role.uow.ts';

export type VendorUserRoleReturnType = {
    VendorUserRoleUnitOfWork: Domain.Contexts.Community.Role.VendorUserRole.VendorUserRoleUnitOfWork;
};

type VendorUserRolePersistenceType = (
    models: ModelsContext,
    passport: Domain.Passport,
) => VendorUserRoleReturnType;

export const VendorUserRolePersistence: VendorUserRolePersistenceType = (models: ModelsContext, passport: Domain.Passport) => {
	const VendorUserRoleModel = models.VendorUserRole;
	return {
		VendorUserRoleUnitOfWork: getVendorUserRoleUnitOfWork(VendorUserRoleModel, passport),
	};
};