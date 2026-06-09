import type { GraphQLResolveInfo } from 'graphql';
import type { Resolvers } from '../builder/generated.ts';
import type { GraphContext } from '../context.ts';

const staffUser: Resolvers = {
	StaffUserActivityDetail: {
		activityByStaffUserDisplayName: async (parent, _args, context: GraphContext, _info: GraphQLResolveInfo) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				return parent.activityByStaffUserId;
			}
			const users = await context.applicationServices.User.StaffUser.list();
			const found = users.find((u) => String(u.id) === String(parent.activityByStaffUserId));
			return found?.displayName ?? parent.activityByStaffUserId;
		},
	},
};

export default staffUser;
