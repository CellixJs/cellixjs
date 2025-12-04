import type { ModelsContext } from '../../../index.ts';
import { type EndUserRoleReturnType, EndUserRolePersistence } from './role/end-user-role/index.ts';
import { type VendorUserRoleReturnType, VendorUserRolePersistence } from './role/vendor-user-role/index.ts';
import { type MemberReturnType, MemberPersistence } from './member/index.ts';
import { type CommunityReturnType, CommunityPersistence } from './community/index.ts';
import type { Domain } from '@ocom/domain';

type CommunityContextPersistenceType = (
	models: ModelsContext,
	passport: Domain.Passport,
) => {
	Community: CommunityReturnType;
    Member: MemberReturnType;
    Role: {
        EndUserRole: EndUserRoleReturnType;
        VendorUserRole: VendorUserRoleReturnType;
    };
};


export const CommunityContextPersistence: CommunityContextPersistenceType = (models: ModelsContext, passport: Domain.Passport) => ({
	Community: CommunityPersistence(models, passport),
	Member: MemberPersistence(models, passport),
    Role: {
        EndUserRole: EndUserRolePersistence(models, passport),
        VendorUserRole: VendorUserRolePersistence(models, passport),
    },
});
