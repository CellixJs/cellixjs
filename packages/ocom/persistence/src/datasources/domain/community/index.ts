import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../index.ts';
import * as Community from './community/index.ts';
import * as Member from './member/index.ts';
import { EndUserRolePersistence } from './role/end-user-role/index.ts';
import { VendorUserRolePersistence } from './role/vendor-user-role/index.ts';

export const CommunityContextPersistence = (models: ModelsContext, passport: Domain.Passport) => ({
	Community: Community.CommunityPersistence(models, passport),
	Member: Member.MemberPersistence(models, passport),
    Role: {
        EndUserRole: EndUserRolePersistence(models, passport),
        VendorUserRole: VendorUserRolePersistence(models, passport),
    },
});
