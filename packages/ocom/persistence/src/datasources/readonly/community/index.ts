import type { Domain } from '@ocom/domain';
import type { ModelsContext, PersistenceFactory } from '../../../types.ts';
import { CommunityReadRepositoryImpl, type CommunityReadReturnType } from './community/index.ts';
import { MemberReadRepositoryImpl, type MemberReadReturnType } from './member/index.ts';

interface CommunityContext {
    Community: CommunityReadReturnType;
    Member: MemberReadReturnType;
}

type CommunityContextType = PersistenceFactory<CommunityContext>;

export const CommunityContext: CommunityContextType = (models: ModelsContext, passport: Domain.Passport) => ({
    Community: CommunityReadRepositoryImpl(models, passport),
    Member: MemberReadRepositoryImpl(models, passport),
});
