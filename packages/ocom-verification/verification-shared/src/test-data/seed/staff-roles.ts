interface StaffRolePermissionsSeedDocument {
	servicePermissions: { canManageServices: boolean };
	serviceTicketPermissions: {
		canCreateTickets: boolean;
		canManageTickets: boolean;
		canAssignTickets: boolean;
		canUpdateTickets: boolean;
		canWorkOnTickets: boolean;
	};
	violationTicketPermissions: {
		canCreateTickets: boolean;
		canManageTickets: boolean;
		canAssignTickets: boolean;
		canUpdateTickets: boolean;
		canWorkOnTickets: boolean;
	};
	communityPermissions: {
		canManageCommunities: boolean;
		canManageStaffRolesAndPermissions: boolean;
		canManageAllCommunities: boolean;
		canDeleteCommunities: boolean;
		canChangeCommunityOwner: boolean;
		canReIndexSearchCollections: boolean;
	};
	financePermissions: {
		canManageFinance: boolean;
		canViewGLBatchSummaries: boolean;
		canViewFinanceConfigs: boolean;
		canCreateFinanceConfigs: boolean;
	};
	techAdminPermissions: {
		canManageTechAdmin: boolean;
		canViewDatabaseExplorer: boolean;
		canViewBlobExplorer: boolean;
		canViewQueueDashboard: boolean;
		canSendQueueMessages: boolean;
	};
	userPermissions: {
		canManageUsers: boolean;
		canAssignStaffRoles: boolean;
		canViewStaffUsers: boolean;
	};
	staffRolePermissions: {
		canViewRoles: boolean;
		canAddRole: boolean;
		canEditRole: boolean;
		canRemoveRole: boolean;
	};
	propertyPermissions: {
		canManageProperties: boolean;
		canEditOwnProperty: boolean;
	};
}

export interface StaffRoleSeedDocument {
	_id: string;
	roleType: 'staff-user-role';
	roleName: string;
	enterpriseAppRole: string;
	isDefault: boolean;
	permissions: StaffRolePermissionsSeedDocument;
	schemaVersion: string;
	createdAt: Date;
	updatedAt: Date;
}

export const STAFF_ROLE_IDS = {
	seededTechAdmin: 'b00000000000000000000001',
	seededCaseManager: 'b00000000000000000000002',
} as const;

function buildPermissions(overrides: Partial<StaffRolePermissionsSeedDocument>): StaffRolePermissionsSeedDocument {
	const allFalseTickets = {
		canCreateTickets: false,
		canManageTickets: false,
		canAssignTickets: false,
		canUpdateTickets: false,
		canWorkOnTickets: false,
	};
	return {
		servicePermissions: { canManageServices: false },
		serviceTicketPermissions: { ...allFalseTickets },
		violationTicketPermissions: { ...allFalseTickets },
		communityPermissions: {
			canManageCommunities: false,
			canManageStaffRolesAndPermissions: false,
			canManageAllCommunities: false,
			canDeleteCommunities: false,
			canChangeCommunityOwner: false,
			canReIndexSearchCollections: false,
		},
		financePermissions: {
			canManageFinance: false,
			canViewGLBatchSummaries: false,
			canViewFinanceConfigs: false,
			canCreateFinanceConfigs: false,
		},
		techAdminPermissions: {
			canManageTechAdmin: false,
			canViewDatabaseExplorer: false,
			canViewBlobExplorer: false,
			canViewQueueDashboard: false,
			canSendQueueMessages: false,
		},
		userPermissions: {
			canManageUsers: false,
			canAssignStaffRoles: false,
			canViewStaffUsers: false,
		},
		staffRolePermissions: {
			canViewRoles: false,
			canAddRole: false,
			canEditRole: false,
			canRemoveRole: false,
		},
		propertyPermissions: {
			canManageProperties: false,
			canEditOwnProperty: false,
		},
		...overrides,
	};
}

const seedTimestamp = new Date('2024-01-01T00:00:00Z');

/**
 * Staff roles seeded for verification suites.
 *
 * The seeded tech admin role grants `canManageStaffRolesAndPermissions`, which the
 * staff passport requires before staff-role aggregates accept mutations.
 */
export const staffRoles: StaffRoleSeedDocument[] = [
	{
		_id: STAFF_ROLE_IDS.seededTechAdmin,
		roleType: 'staff-user-role',
		roleName: 'Seeded Tech Admin',
		enterpriseAppRole: 'Staff.TechAdmin',
		isDefault: false,
		permissions: buildPermissions({
			communityPermissions: {
				canManageCommunities: true,
				canManageStaffRolesAndPermissions: true,
				canManageAllCommunities: true,
				canDeleteCommunities: false,
				canChangeCommunityOwner: false,
				canReIndexSearchCollections: false,
			},
			techAdminPermissions: {
				canManageTechAdmin: true,
				canViewDatabaseExplorer: true,
				canViewBlobExplorer: true,
				canViewQueueDashboard: true,
				canSendQueueMessages: true,
			},
			userPermissions: {
				canManageUsers: true,
				canAssignStaffRoles: true,
				canViewStaffUsers: true,
			},
			staffRolePermissions: {
				canViewRoles: true,
				canAddRole: true,
				canEditRole: true,
				canRemoveRole: true,
			},
		}),
		schemaVersion: '1.0.0',
		createdAt: seedTimestamp,
		updatedAt: seedTimestamp,
	},
	{
		_id: STAFF_ROLE_IDS.seededCaseManager,
		roleType: 'staff-user-role',
		roleName: 'Seeded Case Manager',
		enterpriseAppRole: 'Staff.CaseManager',
		isDefault: false,
		permissions: buildPermissions({
			communityPermissions: {
				canManageCommunities: true,
				canManageStaffRolesAndPermissions: false,
				canManageAllCommunities: false,
				canDeleteCommunities: false,
				canChangeCommunityOwner: false,
				canReIndexSearchCollections: false,
			},
		}),
		schemaVersion: '1.0.0',
		createdAt: seedTimestamp,
		updatedAt: seedTimestamp,
	},
];
