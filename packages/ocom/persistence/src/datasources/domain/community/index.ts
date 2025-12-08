import type { Domain } from '@ocom/domain';
import type { ModelsContext, PersistenceFactory } from '../../../types.ts';
import { type CommunityReturnType, CommunityPersistence } from './community/index.ts';
import { type MemberReturnType, MemberPersistence } from './member/index.ts';
import { type EndUserRoleReturnType, EndUserRolePersistence } from './role/end-user-role/index.ts';
import { type VendorUserRoleReturnType, VendorUserRolePersistence } from './role/vendor-user-role/index.ts';

interface CommunityContextPersistence {
	Community: CommunityReturnType;
    Member: MemberReturnType;
    Role: {
        EndUserRole: EndUserRoleReturnType;
        VendorUserRole: VendorUserRoleReturnType;
    };
}

type CommunityContextPersistenceType = PersistenceFactory<CommunityContextPersistence>;

export const CommunityContextPersistence: CommunityContextPersistenceType = (models: ModelsContext, passport: Domain.Passport) => ({
	Community: CommunityPersistence(models, passport),
	Member: MemberPersistence(models, passport),
    Role: {
        EndUserRole: EndUserRolePersistence(models, passport),
        VendorUserRole: VendorUserRolePersistence(models, passport),
    },
});
