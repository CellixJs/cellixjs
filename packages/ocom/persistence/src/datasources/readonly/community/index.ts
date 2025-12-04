import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../index.ts';
import { CommunityReadRepositoryImpl, type CommunityReadRepository } from './community/index.ts';
import { MemberReadRepositoryImpl, type MemberReadRepository } from './member/index.ts';

type CommunityContextType = (
    models: ModelsContext,
    passport: Domain.Passport,
) => {
    Community: { CommunityReadRepo: CommunityReadRepository; };
    Member: { MemberReadRepo: MemberReadRepository; };
};

export const CommunityContext: CommunityContextType = (models: ModelsContext, passport: Domain.Passport) => ({
    Community: CommunityReadRepositoryImpl(models, passport),
    Member: MemberReadRepositoryImpl(models, passport),
});
