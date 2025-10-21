import type { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import { CommunityModelFactory } from './community/index.ts';
import { MemberModelFactory } from './member/index.ts';
import {
	EndUserModelFactory,
	StaffUserModelFactory,
	VendorUserModelFactory,
	UserModelFactory,
} from './user/index.ts';
import { RoleModelFactory } from './role/role.model.ts';
import { EndUserRoleModelFactory } from './role/end-user-role.model.ts';
import { StaffRoleModelFactory } from './role/staff-role.model.ts';
import { VendorUserRoleModelFactory } from './role/vendor-user-role.model.ts';
import { ServiceModelFactory } from './service/index.ts';
import { PropertyModelFactory } from './property/index.ts';

export * as Community from './community/index.ts';
export * as Member from './member/index.ts';
export * as Role from './role/index.ts';
export * as User from './user/index.ts';
export * as Service from './service/index.ts';
export * as Property from './property/index.ts';

export const mongooseContextBuilder = (
	initializedService: MongooseSeedwork.MongooseContextFactory,
) => {
	const roleModel = RoleModelFactory(initializedService);
	const userModel = UserModelFactory(initializedService);
	return {
		Community: {
			Community: CommunityModelFactory(initializedService),
			Member: MemberModelFactory(initializedService),
			EndUserRole: EndUserRoleModelFactory(roleModel),
			StaffRole: StaffRoleModelFactory(roleModel),
			VendorUserRole: VendorUserRoleModelFactory(roleModel),
		},
		User: {
			EndUser: EndUserModelFactory(userModel),
			StaffUser: StaffUserModelFactory(userModel),
			VendorUser: VendorUserModelFactory(userModel),
		},
		Service: {
			Service: ServiceModelFactory(initializedService),
		},
		Property: {
			Property: PropertyModelFactory(initializedService),
		},
	};
};

/*
export type MongooseContext = ReturnType<typeof mongooseContextBuilder>;

Community.CommunityModel.findById('123').then((doc) => {
  doc?.whiteLabelDomain
  doc?.createdBy
});

let x = mongooseContextBuilder(null as any).Community.Community;
x.findById('123').then((doc) => {
  doc?.whiteLabelDomain
  doc?.createdBy
  console.log(doc);
});

*/
