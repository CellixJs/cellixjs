import type * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import type { Passport } from '../../passport.ts';
import type { EndUserRepository } from './end-user.repository.ts';
import type { EndUser, EndUserProps } from './end-user.ts';

export interface EndUserUnitOfWork
	extends DomainSeedwork.UnitOfWork<
			Passport,
			EndUserProps,
			EndUser<EndUserProps>,
			EndUserRepository<EndUserProps>
		>,
		DomainSeedwork.InitializedUnitOfWork<
			Passport,
			EndUserProps,
			EndUser<EndUserProps>,
			EndUserRepository<EndUserProps>
		> {}
