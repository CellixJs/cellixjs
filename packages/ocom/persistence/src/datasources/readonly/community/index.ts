import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../index.ts';
import { CommunityReadRepositoryImpl, type CommunityReadReturnType } from './community/index.ts';
import { MemberReadRepositoryImpl, type MemberReadReturnType } from './member/index.ts';

interface CommunityContext {
    Community: CommunityReadReturnType;
    Member: MemberReadReturnType;
}

type CommunityContextType = (
    models: ModelsContext,
    passport: Domain.Passport,
) => CommunityContext;

export const CommunityContext: CommunityContextType = (models: ModelsContext, passport: Domain.Passport) => ({
    Community: CommunityReadRepositoryImpl(models, passport),
    Member: MemberReadRepositoryImpl(models, passport),
});
