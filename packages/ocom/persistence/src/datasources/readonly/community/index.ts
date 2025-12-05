import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../index.ts';
import { type CommunityReadRepositoryImplType, CommunityReadRepositoryImpl } from './community/index.ts';
import { MemberReadRepositoryImpl, type MemberReadRepositoryImplType } from './member/index.ts';

type CommunityContextType = (
    models: ModelsContext,
    passport: Domain.Passport,
) => {
    Community: ReturnType<CommunityReadRepositoryImplType>;
    Member: ReturnType<MemberReadRepositoryImplType>;
};

export const CommunityContext: CommunityContextType = (models: ModelsContext, passport: Domain.Passport) => ({
    Community: CommunityReadRepositoryImpl(models, passport),
    Member: MemberReadRepositoryImpl(models, passport),
});
