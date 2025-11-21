import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../index.ts';
import * as EndUser from './end-user/index.ts';
import * as StaffRole from './staff-role/index.ts';
import * as StaffUser from './staff-user/index.ts';
import * as VendorUser from './vendor-user/index.ts';

export const UserContextPersistence = (
	models: ModelsContext,
	passport: Domain.Passport,
) => ({
	EndUser: EndUser.EndUserPersistence(models, passport),
	StaffRole: StaffRole.StaffRolePersistence(models, passport),
	StaffUser: StaffUser.StaffUserPersistence(models, passport),
	VendorUser: VendorUser.VendorUserPersistence(models, passport),
});
