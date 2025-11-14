import {
	GuestPassport,
	MemberPassport,
	StaffUserPassport,
	SystemPassport,
} from '../iam/index.ts';
import type { PermissionsSpec } from '../iam/system/system.passport-base.ts';
import type { Contexts } from '../index.ts';
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
	// forEndUser(endUser: Contexts.User.EndUser.EndUserEntityReference): Passport {
	//     return new EndUserPassport(endUser);
	// },

	// for logged-in users on account portal within a community
	forMember(
		endUser: Contexts.User.EndUser.EndUserEntityReference,
		member: Contexts.Community.Member.MemberEntityReference,
		community: Contexts.Community.Community.CommunityEntityReference,
	): Passport {
		return new MemberPassport(endUser, member, community);
	},

	// for logged-in users on staff portal - defers to role permissions for that staff user
	forStaffUser(
		staffUser: Contexts.User.StaffUser.StaffUserEntityReference,
	): Passport {
		return new StaffUserPassport(staffUser);
	},

	// for logged-in users on vendor portal - defers to role permissions for that vendor user
	// forVendorUser(vendorUser: Contexts.User.VendorUser.VendorUserEntityReference): Passport {
	//     return new VendorUserPassport(vendorUser);
	// },

	// for users who are not logged in on any portal - defaults to false for all permissions
	forGuest(): Passport {
		return new GuestPassport();
	},

	forSystem(permissions?: Partial<PermissionsSpec>): Passport {
		return new SystemPassport(permissions);
	},
};
