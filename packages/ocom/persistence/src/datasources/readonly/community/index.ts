import type { Passport } from '@ocom/domain';
import type { ModelsContext } from '../../../index.ts';
import { CommunityReadRepositoryImpl } from './community/index.ts';
import { MemberReadRepositoryImpl } from './member/index.ts';

import { Community } from '@ocom/domain/contexts/community/community';
import { Member } from '@ocom/domain/contexts/community/member';
export const CommunityContext = (models: ModelsContext, passport: Passport) => ({
    Community: CommunityReadRepositoryImpl(models, passport),
    Member: MemberReadRepositoryImpl(models, passport),
});
