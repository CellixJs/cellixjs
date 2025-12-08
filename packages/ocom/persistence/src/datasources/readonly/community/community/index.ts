import type { Domain } from '@ocom/domain';
import type { ModelsContext, PersistenceFactory } from '../../../../types.ts';
import { type CommunityReadRepository, getCommunityReadRepository } from './community.read-repository.ts';

export type { CommunityReadRepository } from './community.read-repository.ts';

export type CommunityReadReturnType = {
    CommunityReadRepo: CommunityReadRepository;
};

export type CommunityReadRepositoryImplType = PersistenceFactory<CommunityReadReturnType>;

export const CommunityReadRepositoryImpl: CommunityReadRepositoryImplType = (models: ModelsContext, passport: Domain.Passport) => {
    return {
        CommunityReadRepo: getCommunityReadRepository(models, passport),
    };
};
