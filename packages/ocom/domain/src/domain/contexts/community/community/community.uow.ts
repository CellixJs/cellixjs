import type {
	InitializedUnitOfWork,
	UnitOfWork,
} from '@cellix/domain-seedwork/unit-of-work';
import type { Passport } from '../../passport.ts';
import type { CommunityRepository } from './community.repository.ts';
import type { Community, CommunityProps } from './community.ts';

export interface CommunityUnitOfWork
	extends UnitOfWork<
			Passport,
			CommunityProps,
			Community<CommunityProps>,
			CommunityRepository<CommunityProps>
		>,
		InitializedUnitOfWork<
			Passport,
			CommunityProps,
			Community<CommunityProps>,
			CommunityRepository<CommunityProps>
		> {}
