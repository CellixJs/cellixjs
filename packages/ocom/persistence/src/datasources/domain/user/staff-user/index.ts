import type { Domain } from '@ocom/domain';
import type { ModelsContext, PersistenceFactory } from '../../../../types.ts';
import { getStaffUserUnitOfWork } from './staff-user.uow.ts';

export type StaffUserReturnType = {
    StaffUserUnitOfWork: Domain.Contexts.User.StaffUser.StaffUserUnitOfWork;
};

export type StaffUserPersistenceType = PersistenceFactory<StaffUserReturnType>;

export const StaffUserPersistence: StaffUserPersistenceType = (models: ModelsContext, passport: Domain.Passport) => {
	const staffUserModel = models.StaffUser;
	if (!staffUserModel) {
		throw new Error('StaffUser model is not available in the mongoose context');
	}

	return {
		StaffUserUnitOfWork: getStaffUserUnitOfWork(staffUserModel, passport),
	};
};
