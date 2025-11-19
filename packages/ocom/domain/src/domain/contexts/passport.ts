import { GuestPassport } from '../iam/guest/guest.passport.ts';
import { MemberPassport } from '../iam/member/member.passport.ts';
import { StaffUserPassport } from '../iam/user/staff-user/staff-user.passport.ts';
import { SystemPassport } from '../iam/system/system.passport.ts';
import type { PermissionsSpec } from '../iam/system/system.passport-base.ts';
import type { EndUserEntityReference } from './user/end-user/end-user.ts';
import type { MemberEntityReference } from './community/member/member.ts';
import type { CommunityEntityReference } from './community/community/community.ts';
import type { StaffUserEntityReference } from './user/staff-user/staff-user.ts';
import type { CasePassport } from './case/case.passport.ts';
import type { CommunityPassport } from './community/community.passport.ts';
import type { PropertyPassport } from './property/property.passport.ts';
import type { ServicePassport } from './service/service.passport.ts';
import type { UserPassport } from './user/user.passport.ts';

export interface Passport {
    get case(): CasePassport;
	get community(): CommunityPassport;
    get property(): PropertyPassport;
	get service(): ServicePassport;
	get user(): UserPassport;
}

export const PassportFactory = {
    // for logged-in users on account portal not within a community
    // forEndUser(endUser: EndUserEntityReference): Passport {
    //     return new EndUserPassport(endUser);
    // },

    // for logged-in users on account portal within a community
    forMember(endUser: EndUserEntityReference, member: MemberEntityReference, community: CommunityEntityReference): Passport {
        return new MemberPassport(endUser, member, community);
    },

    // for logged-in users on staff portal - defers to role permissions for that staff user
    forStaffUser(staffUser: StaffUserEntityReference): Passport {
        return new StaffUserPassport(staffUser);
    },

    // for logged-in users on vendor portal - defers to role permissions for that vendor user
    // forVendorUser(vendorUser: VendorUser.VendorUserEntityReference): Passport {
    //     return new VendorUserPassport(vendorUser);
    // },

    // for users who are not logged in on any portal - defaults to false for all permissions
    forGuest(): Passport {
        return new GuestPassport();
    },

    forSystem(permissions?: Partial<PermissionsSpec>): Passport {
        return new SystemPassport(permissions);
    }
}
