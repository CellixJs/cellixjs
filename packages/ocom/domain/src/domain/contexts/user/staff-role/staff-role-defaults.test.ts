import { expect, test } from 'vitest';
import type { Passport } from '../../passport.ts';
import { StaffRole, type StaffRoleProps } from './staff-role.ts';

function makePassport(): Passport {
	return {
		user: {
			forStaffRole: () => ({
				determineIf: (fn: (p: { canManageStaffRolesAndPermissions: boolean; isSystemAccount: boolean }) => boolean) => fn({ canManageStaffRolesAndPermissions: true, isSystemAccount: false }),
			}),
		},
	} as unknown as Passport;
}

function makeBaseProps(overrides: Partial<StaffRoleProps> = {}): StaffRoleProps {
	const emptyPermissions = {
		communityPermissions: {
			canManageCommunities: false,
			canManageStaffRolesAndPermissions: false,
			canManageAllCommunities: false,
			canDeleteCommunities: false,
			canChangeCommunityOwner: false,
			canReIndexSearchCollections: false,
		},
		propertyPermissions: {
			canManageProperties: false,
			canEditOwnProperty: false,
		},
		serviceTicketPermissions: {
			canCreateTickets: false,
			canManageTickets: false,
			canAssignTickets: false,
			canWorkOnTickets: false,
		},
		servicePermissions: {
			canManageServices: false,
		},
		violationTicketPermissions: {
			canCreateTickets: false,
			canManageTickets: false,
			canAssignTickets: false,
			canWorkOnTickets: false,
		},
		financePermissions: {
			canManageFinance: false,
			canViewGLBatchSummaries: false,
			canViewFinanceConfigs: false,
			canCreateFinanceConfigs: false,
		},
		techAdminPermissions: {
			canManageTechAdmin: false,
		},
		userPermissions: {
			canManageUsers: false,
		},
	} as const;

	return {
		id: 'role-1',
		roleName: 'Support',
		isDefault: false,
		permissions: emptyPermissions as unknown as StaffRoleProps['permissions'],
		roleType: 'staff-role',
		createdAt: new Date(),
		updatedAt: new Date(),
		schemaVersion: '1.0',
		...overrides,
	};
}

test('applyDefaultSpec sets CaseManager permissions correctly and marks default', () => {
	const passport = makePassport();
	const role = StaffRole.getNewInstance(makeBaseProps(), passport, 'Staff.CaseManager', false);

	StaffRole.applyDefaultSpec(role, 'Staff.CaseManager');

	expect(role.permissions.communityPermissions.canManageCommunities).toBe(true);
	expect(role.permissions.financePermissions.canManageFinance).toBe(false);
	expect(role.permissions.techAdminPermissions.canManageTechAdmin).toBe(false);
	expect(role.permissions.userPermissions.canManageUsers).toBe(true);
	expect(role.isDefault).toBe(true);
});

test('applyDefaultSpec sets Finance permissions correctly and marks default', () => {
	const passport = makePassport();
	const role = StaffRole.getNewInstance(makeBaseProps(), passport, 'Staff.Finance', false);

	StaffRole.applyDefaultSpec(role, 'Staff.Finance');

	expect(role.permissions.communityPermissions.canManageCommunities).toBe(false);
	expect(role.permissions.financePermissions.canManageFinance).toBe(true);
	expect(role.permissions.techAdminPermissions.canManageTechAdmin).toBe(false);
	expect(role.permissions.userPermissions.canManageUsers).toBe(false);
	expect(role.isDefault).toBe(true);
});

test('applyDefaultSpec sets ServiceLineOwner permissions correctly and marks default', () => {
	const passport = makePassport();
	const role = StaffRole.getNewInstance(makeBaseProps(), passport, 'Staff.ServiceLineOwner', false);

	StaffRole.applyDefaultSpec(role, 'Staff.ServiceLineOwner');

	expect(role.permissions.communityPermissions.canManageCommunities).toBe(true);
	expect(role.permissions.financePermissions.canManageFinance).toBe(false);
	expect(role.permissions.techAdminPermissions.canManageTechAdmin).toBe(false);
	expect(role.permissions.userPermissions.canManageUsers).toBe(true);
	expect(role.isDefault).toBe(true);
});

test('applyDefaultSpec sets TechAdmin permissions correctly and marks default', () => {
	const passport = makePassport();
	const role = StaffRole.getNewInstance(makeBaseProps(), passport, 'Staff.TechAdmin', false);

	StaffRole.applyDefaultSpec(role, 'Staff.TechAdmin');

	expect(role.permissions.communityPermissions.canManageCommunities).toBe(false);
	expect(role.permissions.financePermissions.canManageFinance).toBe(false);
	expect(role.permissions.techAdminPermissions.canManageTechAdmin).toBe(true);
	expect(role.permissions.userPermissions.canManageUsers).toBe(false);
	expect(role.isDefault).toBe(true);
});
