import type { Domain } from '@ocom/domain';
import { describe, expect, it } from 'vitest';
import { applyCommunityPermissions, applyFinancePermissions, applyRolePermissions, applyTechAdminPermissions, applyUserPermissions } from './apply-permissions.ts';

type StaffRole = Domain.Contexts.User.StaffRole.StaffRole<Domain.Contexts.User.StaffRole.StaffRoleProps>;

function makeStaffRole() {
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
				canViewDatabaseExplorer: false,
				canViewBlobExplorer: false,
				canViewQueueDashboard: false,
				canSendQueueMessages: false,
			},
		},
	} as unknown as StaffRole;
}

describe('applyCommunityPermissions', () => {
	it('is a no-op when permissions are undefined', () => {
		const staffRole = makeStaffRole();
		applyCommunityPermissions(staffRole, undefined);
		expect(staffRole.permissions.communityPermissions.canManageCommunities).toBe(false);
	});

	it('applies all provided community permissions', () => {
		const staffRole = makeStaffRole();
		applyCommunityPermissions(staffRole, {
			canManageCommunities: true,
			canManageStaffRolesAndPermissions: true,
			canManageAllCommunities: true,
			canDeleteCommunities: true,
			canChangeCommunityOwner: true,
			canReIndexSearchCollections: true,
		});
		const cp = staffRole.permissions.communityPermissions;
		expect(cp.canManageCommunities).toBe(true);
		expect(cp.canManageStaffRolesAndPermissions).toBe(true);
		expect(cp.canManageAllCommunities).toBe(true);
		expect(cp.canDeleteCommunities).toBe(true);
		expect(cp.canChangeCommunityOwner).toBe(true);
		expect(cp.canReIndexSearchCollections).toBe(true);
	});

	it('leaves unspecified community permissions unchanged', () => {
		const staffRole = makeStaffRole();
		applyCommunityPermissions(staffRole, { canManageCommunities: true });
		const cp = staffRole.permissions.communityPermissions;
		expect(cp.canManageCommunities).toBe(true);
		expect(cp.canManageStaffRolesAndPermissions).toBe(false);
		expect(cp.canManageAllCommunities).toBe(false);
		expect(cp.canDeleteCommunities).toBe(false);
		expect(cp.canChangeCommunityOwner).toBe(false);
		expect(cp.canReIndexSearchCollections).toBe(false);
	});
});

describe('applyUserPermissions', () => {
	it('is a no-op when permissions are undefined', () => {
		const staffRole = makeStaffRole();
		applyUserPermissions(staffRole, undefined);
		expect(staffRole.permissions.userPermissions.canManageUsers).toBe(false);
	});

	it('applies all provided user permissions', () => {
		const staffRole = makeStaffRole();
		applyUserPermissions(staffRole, {
			canManageUsers: true,
			canAssignStaffRoles: true,
			canViewStaffUsers: true,
		});
		const up = staffRole.permissions.userPermissions;
		expect(up.canManageUsers).toBe(true);
		expect(up.canAssignStaffRoles).toBe(true);
		expect(up.canViewStaffUsers).toBe(true);
	});
});

describe('applyRolePermissions', () => {
	it('is a no-op when permissions are undefined', () => {
		const staffRole = makeStaffRole();
		applyRolePermissions(staffRole, undefined);
		expect(staffRole.permissions.staffRolePermissions.canViewRoles).toBe(false);
	});

	it('applies all provided role permissions', () => {
		const staffRole = makeStaffRole();
		applyRolePermissions(staffRole, {
			canViewRoles: true,
			canAddRole: true,
			canEditRole: true,
			canRemoveRole: true,
		});
		const rp = staffRole.permissions.staffRolePermissions;
		expect(rp.canViewRoles).toBe(true);
		expect(rp.canAddRole).toBe(true);
		expect(rp.canEditRole).toBe(true);
		expect(rp.canRemoveRole).toBe(true);
	});
});

describe('applyFinancePermissions', () => {
	it('is a no-op when permissions are undefined', () => {
		const staffRole = makeStaffRole();
		applyFinancePermissions(staffRole, undefined);
		expect(staffRole.permissions.financePermissions.canManageFinance).toBe(false);
	});

	it('applies all provided finance permissions', () => {
		const staffRole = makeStaffRole();
		applyFinancePermissions(staffRole, {
			canManageFinance: true,
			canViewGLBatchSummaries: true,
			canViewFinanceConfigs: true,
			canCreateFinanceConfigs: true,
		});
		const fp = staffRole.permissions.financePermissions;
		expect(fp.canManageFinance).toBe(true);
		expect(fp.canViewGLBatchSummaries).toBe(true);
		expect(fp.canViewFinanceConfigs).toBe(true);
		expect(fp.canCreateFinanceConfigs).toBe(true);
	});
});

describe('applyTechAdminPermissions', () => {
	it('is a no-op when permissions are undefined', () => {
		const staffRole = makeStaffRole();
		applyTechAdminPermissions(staffRole, undefined);
		expect(staffRole.permissions.techAdminPermissions.canManageTechAdmin).toBe(false);
	});

	it('applies all provided tech admin permissions', () => {
		const staffRole = makeStaffRole();
		applyTechAdminPermissions(staffRole, {
			canManageTechAdmin: true,
			canViewDatabaseExplorer: true,
			canViewBlobExplorer: true,
			canViewQueueDashboard: true,
			canSendQueueMessages: true,
		});
		const tp = staffRole.permissions.techAdminPermissions;
		expect(tp.canManageTechAdmin).toBe(true);
		expect(tp.canViewDatabaseExplorer).toBe(true);
		expect(tp.canViewBlobExplorer).toBe(true);
		expect(tp.canViewQueueDashboard).toBe(true);
		expect(tp.canSendQueueMessages).toBe(true);
	});
});
