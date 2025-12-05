import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { type MemberReadRepository, getMemberReadRepository } from './member.read-repository.ts';

export type { MemberReadRepository } from './member.read-repository.ts';

export type MemberReadReturnType = {
    MemberReadRepo: MemberReadRepository;
};

export type MemberReadRepositoryImplType = (
    models: ModelsContext,
    passport: Domain.Passport
) => MemberReadReturnType;

export const MemberReadRepositoryImpl: MemberReadRepositoryImplType = (models: ModelsContext, passport: Domain.Passport) => {
    return {
        MemberReadRepo: getMemberReadRepository(models, passport),
    };
};
