import type { EndUserRole } from '@ocom/data-sources-mongoose-models/role/end-user-role';
import { COMMUNITY_IDS } from './communities.ts';

export const ROLE_IDS = {
	admin: 'c00000000000000000000001',
	member: 'c00000000000000000000002',
} as const;

type EndUserRoleSeedPermissions = {
	servicePermissions: {
		canManageServices: boolean;
	};
	serviceTicketPermissions: {
		canCreateTickets: boolean;
		canManageTickets: boolean;
		canAssignTickets: boolean;
		canWorkOnTickets: boolean;
	};
	violationTicketPermissions: {
		canCreateTickets: boolean;
		canManageTickets: boolean;
		canAssignTickets: boolean;
		canWorkOnTickets: boolean;
	};
	communityPermissions: {
		canManageRolesAndPermissions: boolean;
		canManageCommunitySettings: boolean;
		canManageSiteContent: boolean;
		canManageMembers: boolean;
		canEditOwnMemberProfile: boolean;
		canEditOwnMemberAccounts: boolean;
	};
	propertyPermissions: {
		canManageProperties: boolean;
		canEditOwnProperty: boolean;
	};
};

const fullPermissions = {
	servicePermissions: {
		canManageServices: true,
	},
	serviceTicketPermissions: {
		canCreateTickets: true,
		canManageTickets: true,
		canAssignTickets: true,
		canWorkOnTickets: true,
	},
	violationTicketPermissions: {
		canCreateTickets: true,
		canManageTickets: true,
		canAssignTickets: true,
		canWorkOnTickets: true,
	},
	communityPermissions: {
		canManageRolesAndPermissions: true,
		canManageCommunitySettings: true,
		canManageSiteContent: true,
		canManageMembers: true,
		canEditOwnMemberProfile: true,
		canEditOwnMemberAccounts: true,
	},
	propertyPermissions: {
		canManageProperties: true,
		canEditOwnProperty: true,
	},
} satisfies EndUserRoleSeedPermissions;

const basicPermissions = {
	servicePermissions: {
		canManageServices: false,
	},
	serviceTicketPermissions: {
		canCreateTickets: true,
		canManageTickets: false,
		canAssignTickets: false,
		canWorkOnTickets: false,
	},
	violationTicketPermissions: {
		canCreateTickets: true,
		canManageTickets: false,
		canAssignTickets: false,
		canWorkOnTickets: false,
	},
	communityPermissions: {
		canManageRolesAndPermissions: false,
		canManageCommunitySettings: false,
		canManageSiteContent: false,
		canManageMembers: false,
		canEditOwnMemberProfile: true,
		canEditOwnMemberAccounts: true,
	},
	propertyPermissions: {
		canManageProperties: false,
		canEditOwnProperty: true,
	},
} satisfies EndUserRoleSeedPermissions;

export const endUserRoles = [
	{
		_id: ROLE_IDS.admin,
		roleType: 'end-user-roles',
		community: COMMUNITY_IDS.riverside,
		roleName: 'Admin',
		isDefault: false,
		permissions: fullPermissions,
		schemaVersion: '1.0.0',
		createdAt: new Date('2024-02-01T00:00:00Z'),
		updatedAt: new Date('2024-02-01T00:00:00Z'),
	},
	{
		_id: ROLE_IDS.member,
		roleType: 'end-user-roles',
		community: COMMUNITY_IDS.riverside,
		roleName: 'Member',
		isDefault: true,
		permissions: basicPermissions,
		schemaVersion: '1.0.0',
		createdAt: new Date('2024-02-01T00:00:00Z'),
		updatedAt: new Date('2024-02-01T00:00:00Z'),
	},
] as unknown as EndUserRole[];
