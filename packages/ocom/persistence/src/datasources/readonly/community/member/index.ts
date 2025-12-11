import type { Domain } from '@ocom/domain';
import type { ModelsContext, PersistenceFactory } from '../../../../types.ts';
import { type MemberReadRepository, getMemberReadRepository } from './member.read-repository.ts';

export type { MemberReadRepository } from './member.read-repository.ts';

export type MemberReadReturnType = {
    MemberReadRepo: MemberReadRepository;
};

export const MemberReadRepositoryImpl: PersistenceFactory<MemberReadReturnType> = (models: ModelsContext, passport: Domain.Passport) => {
    return {
        MemberReadRepo: getMemberReadRepository(models, passport),
    };
};
