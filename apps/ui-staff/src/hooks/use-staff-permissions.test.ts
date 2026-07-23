import { describe, expect, it } from 'vitest';
import { deriveStaffPermissions } from './use-staff-permissions.ts';

const makeRolePermissions = (canRemoveRole: boolean) => ({
	communityPermissions: {
		canManageCommunities: false,
		canManageStaffRolesAndPermissions: true,
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
		canRemoveRole,
	},
	financePermissions: {
		canManageFinance: false,
	},
	techAdminPermissions: {
		canManageTechAdmin: true,
	},
});

describe('deriveStaffPermissions', () => {
	it('does not infer role removal from broader management permissions', () => {
		const permissions = deriveStaffPermissions(makeRolePermissions(false));

		expect(permissions?.canManageStaffRolesAndPermissions).toBe(true);
		expect(permissions?.canEditRole).toBe(true);
		expect(permissions?.canRemoveRole).toBe(false);
	});

	it('grants role removal when the explicit permission is present', () => {
		const permissions = deriveStaffPermissions(makeRolePermissions(true));

		expect(permissions?.canRemoveRole).toBe(true);
	});
});
