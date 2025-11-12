import type * as MongooseSeedwork from '@cellix/mongoose-seedwork';
import { CommunityModelFactory } from './community/index.ts';
import { MemberModelFactory } from './member/index.ts';
import {
	EndUserModelFactory,
	StaffUserModelFactory,
	VendorUserModelFactory,
	UserModelFactory,
} from './user/index.ts';
import {
    EndUserRoleModelFactory,
    RoleModelFactory,
    StaffRoleModelFactory,
    VendorUserRoleModelFactory,
} from './role/index.ts';
import {
    ServiceTicketModelFactory,
    TicketModelFactory,
} from './case/index.ts';
import { PropertyModelFactory } from './property/index.ts';
import { ServiceModelFactory } from './service/index.ts';

export * as Community from './community/index.ts';
export * as Member from './member/index.ts';
export * as Role from './role/index.ts';
export * as User from './user/index.ts';
export * as Service from './service/index.ts';
export * as Property from './property/index.ts';
export * as Case from './case/index.ts';

export const mongooseContextBuilder = (
	initializedService: MongooseSeedwork.MongooseContextFactory,
) => {
	const roleModel = RoleModelFactory(initializedService);
	const userModel = UserModelFactory(initializedService);
    const ticketModel = TicketModelFactory(initializedService);
	return {
        Case: {
			ServiceTicket: ServiceTicketModelFactory(ticketModel),
		},
		Community: {
			Community: CommunityModelFactory(initializedService),
		},
        Member: {
           Member: MemberModelFactory(initializedService),
        },
        Property: {
			Property: PropertyModelFactory(initializedService),
		},
        Role: {
            EndUserRole: EndUserRoleModelFactory(roleModel),
			StaffRole: StaffRoleModelFactory(roleModel),
			VendorUserRole: VendorUserRoleModelFactory(roleModel),
        },
        Service: {
			Service: ServiceModelFactory(initializedService),
		},
		User: {
			EndUser: EndUserModelFactory(userModel),
			StaffUser: StaffUserModelFactory(userModel),
			VendorUser: VendorUserModelFactory(userModel),
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
