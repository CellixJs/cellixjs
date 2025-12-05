import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { type CommunityReadRepository, getCommunityReadRepository } from './community.read-repository.ts';

export type { CommunityReadRepository } from './community.read-repository.ts';

export type CommunityReadReturnType = {
    CommunityReadRepo: CommunityReadRepository;
};

export type CommunityReadRepositoryImplType = (
    models: ModelsContext,
    passport: Domain.Passport
) => CommunityReadReturnType;

export const CommunityReadRepositoryImpl: CommunityReadRepositoryImplType = (models: ModelsContext, passport: Domain.Passport) => {
    return {
        CommunityReadRepo: getCommunityReadRepository(models, passport),
    };
};
