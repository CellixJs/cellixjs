import type { InitializedUnitOfWork, UnitOfWork } from '@cellix/domain-seedwork/unit-of-work';
import type { Passport } from '../../passport.ts';
import type { CommunityConfigRepository } from './community-config.repository.ts';
import type { CommunityConfig, CommunityConfigProps } from './community-config.ts';

export interface CommunityConfigUnitOfWork
	extends UnitOfWork<Passport, CommunityConfigProps, CommunityConfig<CommunityConfigProps>, CommunityConfigRepository<CommunityConfigProps>>,
		InitializedUnitOfWork<Passport, CommunityConfigProps, CommunityConfig<CommunityConfigProps>, CommunityConfigRepository<CommunityConfigProps>> {}
