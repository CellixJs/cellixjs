import type { Passport } from '@ocom/domain';
import type { ModelsContext } from '../../../index.ts';
import * as Community from './community/index.ts';
import * as Member from './member/index.ts';
import * as Role from './role/index.ts';

import { Community } from '@ocom/domain/contexts/community/community';
import { Member } from '@ocom/domain/contexts/community/member';
import { EndUserRole } from '@ocom/domain/contexts/community/role/end-user-role';
import { VendorUserRole } from '@ocom/domain/contexts/community/role/vendor-user-role';
export const CommunityContextPersistence = (models: ModelsContext, passport: Passport) => ({
	Community: Community.CommunityPersistence(models, passport),
	Member: Member.MemberPersistence(models, passport),
    Role: {
        EndUserRole: Role.EndUserRole.EndUserRolePersistence(models, passport),
        VendorUserRole: Role.VendorUserRole.VendorUserRolePersistence(models, passport),
    },
});
