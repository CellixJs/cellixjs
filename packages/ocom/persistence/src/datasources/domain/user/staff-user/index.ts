import type { Passport } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { getStaffUserUnitOfWork } from './staff-user.uow.ts';

import { StaffUser } from '@ocom/domain/contexts/user/staff-user';
export const StaffUserPersistence = (models: ModelsContext, passport: Passport) => {
	const staffUserModel = models.User?.StaffUser;
	if (!staffUserModel) {
		throw new Error('StaffUser model is not available in the mongoose context');
	}

	return {
		StaffUserUnitOfWork: getStaffUserUnitOfWork(staffUserModel, passport),
	};
};
