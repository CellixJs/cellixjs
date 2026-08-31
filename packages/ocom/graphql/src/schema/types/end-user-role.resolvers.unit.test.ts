import type { GraphQLResolveInfo } from 'graphql';
import { describe, expect, it } from 'vitest';
import type { GraphContext } from '../context.ts';
import endUserRoleResolvers from './end-user-role.resolvers.ts';

type IsNonPropertyAdminResolver = (parent: unknown, args: unknown, context: GraphContext, info: GraphQLResolveInfo) => boolean;

const resolveIsNonPropertyAdmin = (parent: unknown): boolean => {
	const resolver = endUserRoleResolvers.EndUserRolePermissions?.isNonPropertyAdmin as IsNonPropertyAdminResolver;
	return resolver(parent, {}, {} as GraphContext, {} as GraphQLResolveInfo);
};

// Every permission flag the backend member `isAdmin` derivation checks,
// except canManageProperties (see MemberReadRepositoryImpl.isAdmin).
const nonPropertyAdminFlags: ReadonlyArray<readonly [string, string]> = [
	['serviceTicketPermissions', 'canWorkOnTickets'],
	['serviceTicketPermissions', 'canManageTickets'],
	['serviceTicketPermissions', 'canAssignTickets'],
	['communityPermissions', 'canManageEndUserRolesAndPermissions'],
	['communityPermissions', 'canManageCommunitySettings'],
	['communityPermissions', 'canManageSiteContent'],
	['communityPermissions', 'canManageMembers'],
	['violationTicketPermissions', 'canManageTickets'],
	['violationTicketPermissions', 'canAssignTickets'],
	['violationTicketPermissions', 'canWorkOnTickets'],
	['violationTicketPermissions', 'canCreateTickets'],
];

describe('EndUserRolePermissions.isNonPropertyAdmin', () => {
	it('is false when no permission groups are present', () => {
		expect(resolveIsNonPropertyAdmin({})).toBe(false);
		expect(resolveIsNonPropertyAdmin({ communityPermissions: null, serviceTicketPermissions: null, violationTicketPermissions: null })).toBe(false);
	});

	it('is false for a property-only manager', () => {
		expect(
			resolveIsNonPropertyAdmin({
				propertyPermissions: { canManageProperties: true, canEditOwnProperty: true },
				communityPermissions: { canManageEndUserRolesAndPermissions: false, canManageCommunitySettings: false, canManageSiteContent: false, canManageMembers: false },
				serviceTicketPermissions: { canWorkOnTickets: false, canManageTickets: false, canAssignTickets: false },
				violationTicketPermissions: { canCreateTickets: false, canManageTickets: false, canAssignTickets: false, canWorkOnTickets: false },
			}),
		).toBe(false);
	});

	it.each(nonPropertyAdminFlags)('is true when %s.%s is granted', (group, flag) => {
		expect(resolveIsNonPropertyAdmin({ [group]: { [flag]: true } })).toBe(true);
	});

	it('is true for a mixed-permission admin who also manages properties', () => {
		expect(
			resolveIsNonPropertyAdmin({
				propertyPermissions: { canManageProperties: true, canEditOwnProperty: false },
				communityPermissions: { canManageCommunitySettings: true },
			}),
		).toBe(true);
	});
});
