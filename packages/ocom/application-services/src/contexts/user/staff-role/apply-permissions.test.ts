import { describe, expect, it } from 'vitest';
import { applyCommunityPermissions, applyFinancePermissions, applyRolePermissions, applyTechAdminPermissions, applyUserPermissions } from './apply-permissions.ts';

function createMockStaffRole() {
	return {
		permissions: {
			communityPermissions: {
				canManageCommunities: false,
				canManageStaffRolesAndPermissions: false,
				canManageAllCommunities: false,
				canDeleteCommunities: false,
				canChangeCommunityOwner: false,
				canReIndexSearchCollections: false,
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
			financePermissions: {
				canManageFinance: false,
				canViewGLBatchSummaries: false,
				canViewFinanceConfigs: false,
				canCreateFinanceConfigs: false,
			},
			techAdminPermissions: {
				canManageTechAdmin: false,
				canViewDatabaseDocuments: false,
				canViewBlobExplorer: false,
				canViewQueueDashboard: false,
				canSendQueueMessages: false,
			},
		},
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	} as any;
}

describe('applyCommunityPermissions', () => {
	it('updates all supplied community permissions', () => {
		const role = createMockStaffRole();

		applyCommunityPermissions(role, {
			canManageCommunities: true,
			canManageStaffRolesAndPermissions: true,
			canManageAllCommunities: true,
			canDeleteCommunities: true,
			canChangeCommunityOwner: true,
			canReIndexSearchCollections: true,
		});

		expect(role.permissions.communityPermissions.canManageCommunities).toBe(true);
		expect(role.permissions.communityPermissions.canManageStaffRolesAndPermissions).toBe(true);
		expect(role.permissions.communityPermissions.canManageAllCommunities).toBe(true);
		expect(role.permissions.communityPermissions.canDeleteCommunities).toBe(true);
		expect(role.permissions.communityPermissions.canChangeCommunityOwner).toBe(true);
		expect(role.permissions.communityPermissions.canReIndexSearchCollections).toBe(true);
	});

	it('does nothing when permissions are undefined', () => {
		const role = createMockStaffRole();

		applyCommunityPermissions(role);

		expect(role.permissions.communityPermissions.canManageCommunities).toBe(false);
		expect(role.permissions.communityPermissions.canDeleteCommunities).toBe(false);
	});

	it('updates only supplied properties', () => {
		const role = createMockStaffRole();

		applyCommunityPermissions(role, {
			canManageCommunities: true,
		});

		expect(role.permissions.communityPermissions.canManageCommunities).toBe(true);
		expect(role.permissions.communityPermissions.canDeleteCommunities).toBe(false);
		expect(role.permissions.communityPermissions.canManageAllCommunities).toBe(false);
	});
});

describe('applyUserPermissions', () => {
	it('updates all user permissions', () => {
		const role = createMockStaffRole();

		applyUserPermissions(role, {
			canManageUsers: true,
			canAssignStaffRoles: true,
			canViewStaffUsers: true,
		});

		expect(role.permissions.userPermissions.canManageUsers).toBe(true);
		expect(role.permissions.userPermissions.canAssignStaffRoles).toBe(true);
		expect(role.permissions.userPermissions.canViewStaffUsers).toBe(true);
	});

	it('does nothing when permissions are undefined', () => {
		const role = createMockStaffRole();

		applyUserPermissions(role);

		expect(role.permissions.userPermissions.canManageUsers).toBe(false);
		expect(role.permissions.userPermissions.canAssignStaffRoles).toBe(false);
	});

	it('updates only specified properties', () => {
		const role = createMockStaffRole();

		applyUserPermissions(role, {
			canViewStaffUsers: true,
		});

		expect(role.permissions.userPermissions.canViewStaffUsers).toBe(true);
		expect(role.permissions.userPermissions.canManageUsers).toBe(false);
		expect(role.permissions.userPermissions.canAssignStaffRoles).toBe(false);
	});
});

describe('applyRolePermissions', () => {
	it('updates all staff role permissions', () => {
		const role = createMockStaffRole();

		applyRolePermissions(role, {
			canViewRoles: true,
			canAddRole: true,
			canEditRole: true,
			canRemoveRole: true,
		});

		expect(role.permissions.staffRolePermissions.canViewRoles).toBe(true);
		expect(role.permissions.staffRolePermissions.canAddRole).toBe(true);
		expect(role.permissions.staffRolePermissions.canEditRole).toBe(true);
		expect(role.permissions.staffRolePermissions.canRemoveRole).toBe(true);
	});

	it('does nothing when permissions are undefined', () => {
		const role = createMockStaffRole();

		applyRolePermissions(role);

		expect(role.permissions.staffRolePermissions.canViewRoles).toBe(false);
		expect(role.permissions.staffRolePermissions.canRemoveRole).toBe(false);
	});

	it('updates only provided values', () => {
		const role = createMockStaffRole();

		applyRolePermissions(role, {
			canEditRole: true,
		});

		expect(role.permissions.staffRolePermissions.canEditRole).toBe(true);
		expect(role.permissions.staffRolePermissions.canAddRole).toBe(false);
	});
});

describe('applyFinancePermissions', () => {
	it('updates all finance permissions', () => {
		const role = createMockStaffRole();

		applyFinancePermissions(role, {
			canManageFinance: true,
			canViewGLBatchSummaries: true,
			canViewFinanceConfigs: true,
			canCreateFinanceConfigs: true,
		});

		expect(role.permissions.financePermissions.canManageFinance).toBe(true);
		expect(role.permissions.financePermissions.canViewGLBatchSummaries).toBe(true);
		expect(role.permissions.financePermissions.canViewFinanceConfigs).toBe(true);
		expect(role.permissions.financePermissions.canCreateFinanceConfigs).toBe(true);
	});

	it('does nothing when permissions are undefined', () => {
		const role = createMockStaffRole();

		applyFinancePermissions(role);

		expect(role.permissions.financePermissions.canManageFinance).toBe(false);
		expect(role.permissions.financePermissions.canViewFinanceConfigs).toBe(false);
	});

	it('updates only supplied properties', () => {
		const role = createMockStaffRole();

		applyFinancePermissions(role, {
			canViewFinanceConfigs: true,
		});

		expect(role.permissions.financePermissions.canViewFinanceConfigs).toBe(true);
		expect(role.permissions.financePermissions.canManageFinance).toBe(false);
	});
});

describe('applyTechAdminPermissions', () => {
	it('updates all tech admin permissions', () => {
		const role = createMockStaffRole();

		applyTechAdminPermissions(role, {
			canManageTechAdmin: true,
			canViewDatabaseDocuments: true,
			canViewBlobExplorer: true,
			canViewQueueDashboard: true,
			canSendQueueMessages: true,
		});

		expect(role.permissions.techAdminPermissions.canManageTechAdmin).toBe(true);
		expect(role.permissions.techAdminPermissions.canViewDatabaseDocuments).toBe(true);
		expect(role.permissions.techAdminPermissions.canViewBlobExplorer).toBe(true);
		expect(role.permissions.techAdminPermissions.canViewQueueDashboard).toBe(true);
		expect(role.permissions.techAdminPermissions.canSendQueueMessages).toBe(true);
	});

	it('does nothing when permissions are undefined', () => {
		const role = createMockStaffRole();

		applyTechAdminPermissions(role);

		expect(role.permissions.techAdminPermissions.canManageTechAdmin).toBe(false);
		expect(role.permissions.techAdminPermissions.canViewQueueDashboard).toBe(false);
	});

	it('updates only specified permissions', () => {
		const role = createMockStaffRole();

		applyTechAdminPermissions(role, {
			canViewDatabaseDocuments: true,
		});

		expect(role.permissions.techAdminPermissions.canViewDatabaseDocuments).toBe(true);
		expect(role.permissions.techAdminPermissions.canManageTechAdmin).toBe(false);
		expect(role.permissions.techAdminPermissions.canSendQueueMessages).toBe(false);
	});
});
