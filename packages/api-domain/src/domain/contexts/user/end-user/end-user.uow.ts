import type { DomainSeedwork } from '@cellix/domain-seedwork';
import type { Passport } from '../../passport.ts';
import type { EndUser, EndUserProps } from './end-user.ts';
import type { EndUserRepository } from './end-user.repository.ts';

export interface EndUserUnitOfWork
	extends DomainSeedwork.UnitOfWork<
		Passport,
		EndUserProps,
		EndUser<EndUserProps>,
		EndUserRepository<EndUserProps>
	> {}
