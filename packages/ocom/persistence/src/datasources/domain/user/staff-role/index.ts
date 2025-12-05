import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { getStaffRoleUnitOfWork } from './staff-role.uow.ts';

export type StaffRoleReturnType = {
    StaffRoleUnitOfWork: Domain.Contexts.User.StaffRole.StaffRoleUnitOfWork;
};

export type StaffRolePersistenceType = (
    models: ModelsContext,
    passport: Domain.Passport,
) => StaffRoleReturnType;

export const StaffRolePersistence: StaffRolePersistenceType = (models: ModelsContext, passport: Domain.Passport) => {
	const staffRoleModel = models.StaffRole;
	if (!staffRoleModel) {
		throw new Error('StaffRole model is not available in the mongoose context');
	}

	return {
		StaffRoleUnitOfWork: getStaffRoleUnitOfWork(staffRoleModel, passport),
	};
};
