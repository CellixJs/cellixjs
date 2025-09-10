import type { Domain } from '@ocom/api-domain';
import type { ModelsContext } from '../../../../index.ts';
import { getMemberReadRepository } from './member.read-repository.ts';

export type { MemberReadRepository } from './member.read-repository.ts';

export const MemberReadRepositoryImpl = (models: ModelsContext, passport: Domain.Passport) => {
    return {
        MemberReadRepo: getMemberReadRepository(models, passport),
    };
};
