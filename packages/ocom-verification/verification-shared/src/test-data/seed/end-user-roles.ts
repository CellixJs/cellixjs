import { COMMUNITY_IDS } from './communities.ts';

interface EndUserRolePermissionsSeedDocument {
	servicePermissions: { canManageServices: boolean };
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
}

export interface EndUserRoleSeedDocument {
	_id: string;
	roleType: 'end-user-roles';
	roleName: string;
	community: string;
	isDefault: boolean;
	permissions: EndUserRolePermissionsSeedDocument;
	schemaVersion: string;
	createdAt: Date;
	updatedAt: Date;
}

export const END_USER_ROLE_IDS = {
	seededAdminRole: 'e00000000000000000000001',
	seededMemberRole: 'e00000000000000000000002',
	otherCommunityAdminRole: 'e00000000000000000000003',
} as const;

function buildPermissions(overrides: Partial<EndUserRolePermissionsSeedDocument>): EndUserRolePermissionsSeedDocument {
	const allFalseTickets = {
		canCreateTickets: false,
		canManageTickets: false,
		canAssignTickets: false,
		canWorkOnTickets: false,
	};
	return {
		servicePermissions: { canManageServices: false },
		serviceTicketPermissions: { ...allFalseTickets },
		violationTicketPermissions: { ...allFalseTickets },
		communityPermissions: {
			canManageRolesAndPermissions: false,
			canManageCommunitySettings: false,
			canManageSiteContent: false,
			canManageMembers: false,
			canEditOwnMemberProfile: false,
			canEditOwnMemberAccounts: false,
		},
		propertyPermissions: {
			canManageProperties: false,
			canEditOwnProperty: false,
		},
		...overrides,
	};
}

const adminCommunityPermissions = {
	canManageRolesAndPermissions: true,
	canManageCommunitySettings: true,
	canManageSiteContent: true,
	canManageMembers: true,
	canEditOwnMemberProfile: true,
	canEditOwnMemberAccounts: true,
};

const seedTimestamp = new Date('2024-01-01T00:00:00Z');

/**
 * End-user roles seeded for community verification suites.
 *
 * The admin roles grant `canManageCommunitySettings`, which the community
 * aggregate requires before accepting settings updates; the member role
 * grants no community permissions.
 */
export const endUserRoles: EndUserRoleSeedDocument[] = [
	{
		_id: END_USER_ROLE_IDS.seededAdminRole,
		roleType: 'end-user-roles',
		roleName: 'Seeded Community Admin',
		community: COMMUNITY_IDS.seededCommunity,
		isDefault: false,
		permissions: buildPermissions({ communityPermissions: { ...adminCommunityPermissions } }),
		schemaVersion: '1.0.0',
		createdAt: seedTimestamp,
		updatedAt: seedTimestamp,
	},
	{
		_id: END_USER_ROLE_IDS.seededMemberRole,
		roleType: 'end-user-roles',
		roleName: 'Seeded Community Member',
		community: COMMUNITY_IDS.seededCommunity,
		isDefault: true,
		permissions: buildPermissions({}),
		schemaVersion: '1.0.0',
		createdAt: seedTimestamp,
		updatedAt: seedTimestamp,
	},
	{
		_id: END_USER_ROLE_IDS.otherCommunityAdminRole,
		roleType: 'end-user-roles',
		roleName: 'Other Community Admin',
		community: COMMUNITY_IDS.otherCommunity,
		isDefault: false,
		permissions: buildPermissions({ communityPermissions: { ...adminCommunityPermissions } }),
		schemaVersion: '1.0.0',
		createdAt: seedTimestamp,
		updatedAt: seedTimestamp,
	},
];
