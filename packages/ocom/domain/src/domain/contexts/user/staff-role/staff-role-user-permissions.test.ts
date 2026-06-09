import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import { expect, vi } from 'vitest';
import { StaffRoleUserPermissions } from './staff-role-user-permissions.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/staff-role-user-permissions.feature'));

function makeVisa({ canManageStaffRolesAndPermissions = true, isSystemAccount = false } = {}) {
	return vi.mocked({
		determineIf: vi.fn((fn) => fn({ canManageStaffRolesAndPermissions, isSystemAccount })),
	});
}

function makeProps(overrides = {}) {
	return {
		canManageUsers: false,
		...overrides,
	};
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let visa: ReturnType<typeof makeVisa>;
	let props: ReturnType<typeof makeProps>;
	let entity: StaffRoleUserPermissions;

	BeforeEachScenario(() => {
		visa = makeVisa();
		props = makeProps();
		entity = new StaffRoleUserPermissions(props, visa);
	});

	Background(({ Given, And }) => {
		Given('valid StaffRoleUserPermissionsProps with all permission flags set to false', () => {
			props = makeProps();
		});
		And('a valid UserVisa', () => {
			visa = makeVisa();
		});
	});

	Scenario('Changing canManageUsers with manage staff roles permission', ({ Given, When, Then }) => {
		Given('a StaffRoleUserPermissions entity with permission to manage staff roles', () => {
			visa = makeVisa({ canManageStaffRolesAndPermissions: true, isSystemAccount: false });
			entity = new StaffRoleUserPermissions(makeProps(), visa);
		});
		When('I set canManageUsers to true', () => {
			entity.canManageUsers = true;
		});
		Then('the property should be updated to true', () => {
			expect(entity.canManageUsers).toBe(true);
		});
	});

	Scenario('Changing canManageUsers with system account permission', ({ Given, When, Then }) => {
		Given('a StaffRoleUserPermissions entity with system account permission', () => {
			visa = makeVisa({ canManageStaffRolesAndPermissions: false, isSystemAccount: true });
			entity = new StaffRoleUserPermissions(makeProps(), visa);
		});
		When('I set canManageUsers to true', () => {
			entity.canManageUsers = true;
		});
		Then('the property should be updated to true', () => {
			expect(entity.canManageUsers).toBe(true);
		});
	});

	Scenario('Changing canManageUsers without permission', ({ Given, When, Then }) => {
		let setWithoutPermission: () => void;
		Given('a StaffRoleUserPermissions entity without permission to manage staff roles or system account', () => {
			visa = makeVisa({ canManageStaffRolesAndPermissions: false, isSystemAccount: false });
			entity = new StaffRoleUserPermissions(makeProps(), visa);
		});
		When('I try to set canManageUsers to true', () => {
			setWithoutPermission = () => {
				entity.canManageUsers = true;
			};
		});
		Then('a PermissionError should be thrown', () => {
			expect(setWithoutPermission).toThrow(PermissionError);
			expect(setWithoutPermission).toThrow('Cannot set permission');
		});
	});
});
