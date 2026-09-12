import type { GraphQLResolveInfo } from 'graphql';
import type { Resolvers } from '../builder/generated.ts';
import type { GraphContext } from '../context.ts';

/**
 * Shape of the domain read-model permissions object that backs
 * `EndUserRolePermissions` at runtime; the SDL intentionally exposes only the
 * property group plus the derived admin flag.
 */
interface EndUserRolePermissionsLike {
	communityPermissions?: {
		canManageEndUserRolesAndPermissions?: boolean;
		canManageCommunitySettings?: boolean;
		canManageSiteContent?: boolean;
		canManageMembers?: boolean;
	} | null;
	serviceTicketPermissions?: {
		canWorkOnTickets?: boolean;
		canManageTickets?: boolean;
		canAssignTickets?: boolean;
	} | null;
	violationTicketPermissions?: {
		canCreateTickets?: boolean;
		canManageTickets?: boolean;
		canAssignTickets?: boolean;
		canWorkOnTickets?: boolean;
	} | null;
}

/**
 * Mirrors `MemberReadRepositoryImpl.isAdmin` (persistence) with
 * `canManageProperties` excluded: true when the role grants admin access
 * through any non-property permission.
 */
const grantsNonPropertyAdminAccess = (permissions: EndUserRolePermissionsLike | null | undefined): boolean => {
	return Boolean(
		permissions?.serviceTicketPermissions?.canWorkOnTickets ||
			permissions?.serviceTicketPermissions?.canManageTickets ||
			permissions?.serviceTicketPermissions?.canAssignTickets ||
			permissions?.communityPermissions?.canManageEndUserRolesAndPermissions ||
			permissions?.communityPermissions?.canManageCommunitySettings ||
			permissions?.communityPermissions?.canManageSiteContent ||
			permissions?.communityPermissions?.canManageMembers ||
			permissions?.violationTicketPermissions?.canManageTickets ||
			permissions?.violationTicketPermissions?.canAssignTickets ||
			permissions?.violationTicketPermissions?.canWorkOnTickets ||
			permissions?.violationTicketPermissions?.canCreateTickets,
	);
};

const endUserRole: Resolvers = {
	EndUserRolePermissions: {
		isNonPropertyAdmin: (parent, _args: unknown, _context: GraphContext, _info: GraphQLResolveInfo) => {
			return grantsNonPropertyAdminAccess(parent as EndUserRolePermissionsLike);
		},
	},
	Query: {
		endUserRolesByCommunityId: async (_parent, args: { communityId: string }, context: GraphContext, _info: GraphQLResolveInfo) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				throw new Error('Unauthorized');
			}
			return await context.applicationServices.Community.Role.EndUserRole.queryByCommunityId({
				communityId: args.communityId,
			});
		},
		endUserRole: async (_parent, args: { id: string }, context: GraphContext, _info: GraphQLResolveInfo) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				throw new Error('Unauthorized');
			}
			return await context.applicationServices.Community.Role.EndUserRole.queryById({
				id: args.id,
			});
		},
	},
};

export default endUserRole;
