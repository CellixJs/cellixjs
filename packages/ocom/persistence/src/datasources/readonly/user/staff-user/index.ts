import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { getStaffUserReadRepository } from './staff-user.read-repository.ts';

export type { StaffUserReadRepository } from './staff-user.read-repository.ts';

export const StaffUserReadRepositoryImpl = (models: ModelsContext, passport: Domain.Passport) => {
	return {
		StaffUserReadRepo: getStaffUserReadRepository(models, passport),
	};
};
