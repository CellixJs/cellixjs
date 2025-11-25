import type { Passport } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { getStaffRoleUnitOfWork } from './staff-role.uow.ts';

export const StaffRolePersistence = (models: ModelsContext, passport: Passport) => {
	const staffRoleModel = models.StaffRole;
	if (!staffRoleModel) {
		throw new Error('StaffRole model is not available in the mongoose context');
	}

	return {
		StaffRoleUnitOfWork: getStaffRoleUnitOfWork(staffRoleModel, passport),
	};
};
