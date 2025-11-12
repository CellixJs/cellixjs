import type * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import type { Passport } from '../../passport.ts';
import type { CommunityRepository } from './community.repository.ts';
import type { Community, CommunityProps } from './community.ts';

export interface CommunityUnitOfWork
	extends DomainSeedwork.UnitOfWork<
		Passport,
		CommunityProps,
		Community<CommunityProps>,
		CommunityRepository<CommunityProps>
	>,
    DomainSeedwork.InitializedUnitOfWork<
        Passport,
        CommunityProps,
        Community<CommunityProps>,
        CommunityRepository<CommunityProps>
    > {}