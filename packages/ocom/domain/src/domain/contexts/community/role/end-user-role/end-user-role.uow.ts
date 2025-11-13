import type * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import type { Passport } from '../../../passport.ts';
import type { EndUserRoleRepository } from './end-user-role.repository.ts';
import type { EndUserRole, EndUserRoleProps } from './end-user-role.ts';

export interface EndUserRoleUnitOfWork
	extends DomainSeedwork.UnitOfWork<
			Passport,
			EndUserRoleProps,
			EndUserRole<EndUserRoleProps>,
			EndUserRoleRepository<EndUserRoleProps>
		>,
		DomainSeedwork.InitializedUnitOfWork<
			Passport,
			EndUserRoleProps,
			EndUserRole<EndUserRoleProps>,
			EndUserRoleRepository<EndUserRoleProps>
		> {}
