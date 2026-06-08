import { Before, Given, Then, When } from '@cucumber/cucumber';
import assert from 'node:assert';
import type { Passport } from '../../../src/domain/contexts/passport.ts';
import { StaffRole } from '../../../src/domain/contexts/user/staff-role/staff-role.ts';
import type { StaffRoleProps } from '../../../src/domain/contexts/user/staff-role/staff-role.ts';
import { StaffUser } from '../../../src/domain/contexts/user/staff-user/staff-user.ts';
import { StaffUserCreatedEvent } from '../../../src/domain/events/types/staff-user-created.ts';
import type { StaffUserProps } from '../../../src/domain/contexts/user/staff-user/staff-user.ts';
import { createAuthorizingStaffRoleProps, createMockPassport, createStaffUserProps } from '../support/staff-user-test-utils.ts';

type DefaultRoleKey = 'case manager' | 'service line owner' | 'finance' | 'tech admin';

let passport: Passport;
let staffUser: StaffUser<StaffUserProps>;
let assignedRole: StaffRole<StaffRoleProps>;

Before(() => {
	passport = createMockPassport({ canManageStaffRolesAndPermissions: true });
	staffUser = undefined as unknown as StaffUser<StaffUserProps>;
	assignedRole = undefined as unknown as StaffRole<StaffRoleProps>;
});

Given('I am an authorized staff user administrator', () => {
	passport = createMockPassport({ canManageStaffRolesAndPermissions: true });
	assert.ok(passport);
});

Given('a staff user blueprint is prepared without an assigned role', () => {
	const props = createStaffUserProps();
	props.setRoleRef(undefined);
	assert.strictEqual(props.role, undefined);
});

When('I create the staff user', () => {
	staffUser = StaffUser.getNewUser(createStaffUserProps(), passport, '123e4567-e89b-12d3-a456-426614174000', 'Alice', 'Smith', 'alice@cellix.com');
});

Then('the staff user should be created successfully', () => {
	assert.ok(staffUser);
	assert.strictEqual(staffUser.firstName, 'Alice');
	assert.strictEqual(staffUser.lastName, 'Smith');
	assert.strictEqual(staffUser.email, 'alice@cellix.com');
	assert.strictEqual(staffUser.displayName, 'Alice Smith');
	assert.ok(staffUser.getIntegrationEvents().some((event) => event instanceof StaffUserCreatedEvent));
});

Then('the staff user should have no default role assigned yet', () => {
	assert.strictEqual(staffUser.role, undefined);
});

When('I assign the default staff role {string}', (defaultRole: DefaultRoleKey) => {
	const roleProps = createAuthorizingStaffRoleProps();
	let role: StaffRole<StaffRoleProps> | undefined;

	switch (defaultRole) {
		case 'case manager':
			role = StaffRole.getNewDefaultCaseManagerInstance(roleProps, passport);
			break;
		case 'service line owner':
			role = StaffRole.getNewDefaultServiceLineOwnerInstance(roleProps, passport);
			break;
		case 'finance':
			role = StaffRole.getNewDefaultFinanceInstance(roleProps, passport);
			break;
		case 'tech admin':
			role = StaffRole.getNewDefaultTechAdminInstance(roleProps, passport);
			break;
		default:
			throw new Error(`Unsupported default role: ${defaultRole}`);
	}

	assert.ok(role);
	assignedRole = role;
	staffUser.role = role;
});

Then('the assigned role name should be {string}', (expectedRoleName: string) => {
	assert.strictEqual(assignedRole.roleName, expectedRoleName);
	assert.strictEqual(staffUser.role?.roleName, expectedRoleName);
});

Then('the assigned role enterprise app role should be {string}', (expectedEnterpriseAppRole: string) => {
	assert.strictEqual(assignedRole.enterpriseAppRole, expectedEnterpriseAppRole);
	assert.strictEqual(staffUser.role?.enterpriseAppRole, expectedEnterpriseAppRole);
});

Then('the assigned role should be default', () => {
	assert.strictEqual(assignedRole.isDefault, true);
});

Then(
	'the assigned role permissions should be communities {word}, staff roles {word}, finance {word}, tech admin {word}, users {word}',
	(canManageCommunities: string, canManageStaffRolesAndPermissions: string, canManageFinance: string, canManageTechAdmin: string, canManageUsers: string) => {
		assert.strictEqual(assignedRole.permissions.communityPermissions.canManageCommunities, canManageCommunities === 'true');
		assert.strictEqual(assignedRole.permissions.communityPermissions.canManageStaffRolesAndPermissions, canManageStaffRolesAndPermissions === 'true');
		assert.strictEqual(assignedRole.permissions.financePermissions.canManageFinance, canManageFinance === 'true');
		assert.strictEqual(assignedRole.permissions.techAdminPermissions.canManageTechAdmin, canManageTechAdmin === 'true');
		assert.strictEqual(assignedRole.permissions.userPermissions.canManageUsers, canManageUsers === 'true');
	},
);

Then('the staff user should expose the assigned role', () => {
	assert.ok(staffUser.role);
	assert.strictEqual(staffUser.role?.roleName, assignedRole.roleName);
});
