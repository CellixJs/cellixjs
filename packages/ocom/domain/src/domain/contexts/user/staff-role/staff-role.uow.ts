import type * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import type { Passport } from '../../passport.ts';
import type { StaffRoleRepository } from './staff-role.repository.ts';
import type { StaffRole, StaffRoleProps } from './staff-role.ts';

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
