import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { getStaffUserUnitOfWork } from './staff-user.uow.ts';

export const StaffUserPersistence = (
	models: ModelsContext,
	passport: Domain.Passport,
) => {
	const staffUserModel = models.User?.StaffUser;
	if (!staffUserModel) {
		throw new Error('StaffUser model is not available in the mongoose context');
	}

	return {
		StaffUserUnitOfWork: getStaffUserUnitOfWork(staffUserModel, passport),
	};
};
