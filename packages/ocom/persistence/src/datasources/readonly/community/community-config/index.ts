import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { getCommunityConfigReadRepository } from './community-config.read-repository.ts';

export type { CommunityConfigReadRepository } from './community-config.read-repository.ts';

export const CommunityConfigReadRepositoryImpl = (models: ModelsContext, passport: Domain.Passport) => {
	return {
		CommunityConfigReadRepo: getCommunityConfigReadRepository(models, passport),
	};
};
