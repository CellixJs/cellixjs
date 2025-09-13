import type { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import { CommunityModelFactory } from './community/index.ts';
import { MemberModelFactory } from './member/index.ts';
import { EndUserModelFactory, UserModelFactory } from './user/index.ts';
import { RoleModelFactory } from './role/role.model.ts';
import { EndUserRoleModelFactory } from './role/end-user-role.model.ts';

export * as Community from './community/index.ts';
export * as Member from './member/index.ts';
export * as Role from './role/index.ts';
export * as User from './user/index.ts';

export const mongooseContextBuilder = (
	initializedService: MongooseSeedwork.MongooseContextFactory,
) => {
	return {
		Community: {
			Community: CommunityModelFactory(initializedService),
            Member: MemberModelFactory(initializedService),
            EndUserRole: EndUserRoleModelFactory(RoleModelFactory(initializedService)),
		},
        User: {
            EndUser: EndUserModelFactory(UserModelFactory(initializedService)),
        }
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
