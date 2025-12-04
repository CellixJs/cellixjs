import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { type CommunityReadRepository, getCommunityReadRepository } from './community.read-repository.ts';

export type { CommunityReadRepository } from './community.read-repository.ts';

type CommunityReadRepositoryImplType = (
    models: ModelsContext,
    passport: Domain.Passport
) => {
    CommunityReadRepo: CommunityReadRepository;
};

export const CommunityReadRepositoryImpl: CommunityReadRepositoryImplType = (models: ModelsContext, passport: Domain.Passport) => {
    return {
        CommunityReadRepo: getCommunityReadRepository(models, passport),
    };
};
