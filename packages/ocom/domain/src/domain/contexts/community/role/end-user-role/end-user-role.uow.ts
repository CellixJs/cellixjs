import type {
	InitializedUnitOfWork,
	UnitOfWork,
} from '@cellix/domain-seedwork/unit-of-work';
import type { Passport } from '../../../passport.ts';
import type { EndUserRoleRepository } from './end-user-role.repository.ts';
import type { EndUserRole, EndUserRoleProps } from './end-user-role.ts';

export interface EndUserRoleUnitOfWork
	extends UnitOfWork<
			Passport,
			EndUserRoleProps,
			EndUserRole<EndUserRoleProps>,
			EndUserRoleRepository<EndUserRoleProps>
		>,
		InitializedUnitOfWork<
			Passport,
			EndUserRoleProps,
			EndUserRole<EndUserRoleProps>,
			EndUserRoleRepository<EndUserRoleProps>
		> {}
