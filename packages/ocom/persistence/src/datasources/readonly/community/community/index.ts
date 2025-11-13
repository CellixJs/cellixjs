import type { Passport } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { getCommunityReadRepository } from './community.read-repository.ts';

export type { CommunityReadRepository } from './community.read-repository.ts';

export const CommunityReadRepositoryImpl = (models: ModelsContext, passport: Passport) => {
    return {
        CommunityReadRepo: getCommunityReadRepository(models, passport),
    };
};
