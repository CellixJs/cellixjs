import type { InitializedUnitOfWork, UnitOfWork } from '@cellix/domain-seedwork/unit-of-work';
import type { Passport } from '../../passport.ts';
import type { StaffRole, StaffRoleProps } from './staff-role.ts';
import type { StaffRoleRepository } from './staff-role.repository.ts';

export interface StaffRoleUnitOfWork
	extends UnitOfWork<
		Passport,
		StaffRoleProps,
		StaffRole<StaffRoleProps>,
		StaffRoleRepository<StaffRoleProps>
	>,
	InitializedUnitOfWork<
		Passport,
		StaffRoleProps,
		StaffRole<StaffRoleProps>,
		StaffRoleRepository<StaffRoleProps>
	> {}
