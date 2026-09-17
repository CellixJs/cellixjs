import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../index.ts';
import { CommunityReadRepositoryImpl } from './community/index.ts';
import { CommunityConfigReadRepositoryImpl } from './community-config/index.ts';
import { MemberReadRepositoryImpl } from './member/index.ts';

export const CommunityContext = (models: ModelsContext, passport: Domain.Passport) => ({
	Community: CommunityReadRepositoryImpl(models, passport),
	CommunityConfig: CommunityConfigReadRepositoryImpl(models, passport),
	Member: MemberReadRepositoryImpl(models, passport),
});
