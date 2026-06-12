import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { getStaffRoleReadRepository } from './staff-role.read-repository.ts';

export type { StaffRoleReadRepository } from './staff-role.read-repository.ts';

export const StaffRoleReadRepositoryImpl = (models: ModelsContext, passport: Domain.Passport) => {
	return {
		StaffRoleReadRepo: getStaffRoleReadRepository(models, passport),
	};
};
