import type { DomainSeedwork } from '@cellix/domain-seedwork';
import type { Passport } from '../../passport.ts';
import type { StaffRole, StaffRoleProps } from './staff-role.ts';
import type { StaffRoleRepository } from './staff-role.repository.ts';

export interface StaffRoleUnitOfWork
	extends DomainSeedwork.UnitOfWork<
		Passport,
		StaffRoleProps,
		StaffRole<StaffRoleProps>,
		StaffRoleRepository<StaffRoleProps>
	>,
	DomainSeedwork.InitializedUnitOfWork<
		Passport,
		StaffRoleProps,
		StaffRole<StaffRoleProps>,
		StaffRoleRepository<StaffRoleProps>
	> {}
