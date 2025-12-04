import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../index.ts';
import { type EndUserReturnType, EndUserPersistence } from './end-user/index.ts';
import { type StaffRoleReturnType, StaffRolePersistence } from './staff-role/index.ts';
import { type StaffUserReturnType, StaffUserPersistence } from './staff-user/index.ts';
import { type VendorUserReturnType, VendorUserPersistence } from './vendor-user/index.ts';

type UserContextPersistenceType = (
    models: ModelsContext,
    passport: Domain.Passport,
) => {
    EndUser: EndUserReturnType;
    StaffRole: StaffRoleReturnType;
    StaffUser: StaffUserReturnType;
    VendorUser: VendorUserReturnType;
};

export const UserContextPersistence: UserContextPersistenceType = (models: ModelsContext, passport: Domain.Passport) => ({
	EndUser: EndUserPersistence(models, passport),
	StaffRole: StaffRolePersistence(models, passport),
	StaffUser: StaffUserPersistence(models, passport),
	VendorUser: VendorUserPersistence(models, passport),
});
