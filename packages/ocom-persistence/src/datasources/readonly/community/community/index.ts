import type { Domain } from '@ocom/api-domain';
import type { ModelsContext } from '../../../../index.ts';
import { getCommunityReadRepository } from './community.read-repository.ts';

export type { CommunityReadRepository } from './community.read-repository.ts';

export const CommunityReadRepositoryImpl = (models: ModelsContext, passport: Domain.Passport) => {
    return {
        CommunityReadRepo: getCommunityReadRepository(models, passport),
    };
};
