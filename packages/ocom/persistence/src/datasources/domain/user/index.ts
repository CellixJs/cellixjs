import type { Passport } from '@ocom/domain';
import type { ModelsContext } from '../../../index.ts';
import * as EndUser from './end-user/index.ts';
import * as StaffRole from './staff-role/index.ts';
import * as StaffUser from './staff-user/index.ts';
import * as VendorUser from './vendor-user/index.ts';

import { EndUser } from '@ocom/domain/contexts/user/end-user';
import { StaffRole } from '@ocom/domain/contexts/user/staff-role';
import { StaffUser } from '@ocom/domain/contexts/user/staff-user';
import { VendorUser } from '@ocom/domain/contexts/user/vendor-user';
export const UserContextPersistence = (models: ModelsContext, passport: Passport) => ({
	EndUser: EndUser.EndUserPersistence(models, passport),
	StaffRole: StaffRole.StaffRolePersistence(models, passport),
	StaffUser: StaffUser.StaffUserPersistence(models, passport),
	VendorUser: VendorUser.VendorUserPersistence(models, passport),
});
