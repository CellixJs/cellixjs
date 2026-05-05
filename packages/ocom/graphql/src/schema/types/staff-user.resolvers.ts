import type { GraphQLResolveInfo } from 'graphql';
import type { Resolvers, StaffUser } from '../builder/generated.ts';
import type { GraphContext } from '../context.ts';

const staffUser: Resolvers = {
	Query: {
		currentStaffUserAndCreateIfNotExists: async (_parent, _args, context: GraphContext, _info: GraphQLResolveInfo) => {
			const jwt = context.applicationServices.verifiedUser?.verifiedJwt;
			if (!jwt) {
				throw new Error('Unauthorized');
			}
			const result = await context.applicationServices.User.StaffUser.createIfNotExists({
				externalId: jwt.sub,
				firstName: jwt.given_name ?? '',
				lastName: jwt.family_name ?? '',
				email: jwt.email ?? '',
				aadRoles: jwt.roles ?? [],
			});
			return result as unknown as StaffUser;
		},
	},
};

export default staffUser;
