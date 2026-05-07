import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import { expect, vi } from 'vitest';
import { StaffRoleTechAdminPermissions } from './staff-role-tech-admin-permissions.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/staff-role-tech-admin-permissions.feature'));

function makeVisa({ canManageStaffRolesAndPermissions = true, isSystemAccount = false } = {}) {
	return vi.mocked({
		determineIf: vi.fn((fn) => fn({ canManageStaffRolesAndPermissions, isSystemAccount })),
	});
}

function makeProps(overrides = {}) {
	return {
		canManageTechAdmin: false,
		canViewDatabaseExplorer: false,
		canViewBlobExplorer: false,
		canViewQueueDashboard: false,
		canSendQueueMessages: false,
		...overrides,
	};
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let visa: ReturnType<typeof makeVisa>;
	let props: ReturnType<typeof makeProps>;
	let entity: StaffRoleTechAdminPermissions;

	BeforeEachScenario(() => {
		visa = makeVisa();
		props = makeProps();
		entity = new StaffRoleTechAdminPermissions(props, visa);
	});

	Background(({ Given, And }) => {
		Given('valid StaffRoleTechAdminPermissionsProps with all permission flags set to false', () => {
			props = makeProps();
		});
		And('a valid UserVisa', () => {
			visa = makeVisa();
		});
	});

	Scenario('Changing canManageTechAdmin with manage staff roles permission', ({ Given, When, Then }) => {
		Given('a StaffRoleTechAdminPermissions entity with permission to manage staff roles', () => {
			visa = makeVisa({ canManageStaffRolesAndPermissions: true, isSystemAccount: false });
			entity = new StaffRoleTechAdminPermissions(makeProps(), visa);
		});
		When('I set canManageTechAdmin to true', () => {
			entity.canManageTechAdmin = true;
		});
		Then('the property should be updated to true', () => {
			expect(entity.canManageTechAdmin).toBe(true);
		});
	});

	Scenario('Changing canManageTechAdmin with system account permission', ({ Given, When, Then }) => {
		Given('a StaffRoleTechAdminPermissions entity with system account permission', () => {
			visa = makeVisa({ canManageStaffRolesAndPermissions: false, isSystemAccount: true });
			entity = new StaffRoleTechAdminPermissions(makeProps(), visa);
		});
		When('I set canManageTechAdmin to true', () => {
			entity.canManageTechAdmin = true;
		});
		Then('the property should be updated to true', () => {
			expect(entity.canManageTechAdmin).toBe(true);
		});
	});

	Scenario('Changing canManageTechAdmin without permission', ({ Given, When, Then }) => {
		let setWithoutPermission: () => void;
		Given('a StaffRoleTechAdminPermissions entity without permission to manage staff roles or system account', () => {
			visa = makeVisa({ canManageStaffRolesAndPermissions: false, isSystemAccount: false });
			entity = new StaffRoleTechAdminPermissions(makeProps(), visa);
		});
		When('I try to set canManageTechAdmin to true', () => {
			setWithoutPermission = () => {
				entity.canManageTechAdmin = true;
			};
		});
		Then('a PermissionError should be thrown', () => {
			expect(setWithoutPermission).toThrow(PermissionError);
			expect(setWithoutPermission).toThrow('Cannot set permission');
		});
	});

	Scenario('Changing canViewDatabaseExplorer with manage staff roles permission', ({ Given, When, Then }) => {
		Given('a StaffRoleTechAdminPermissions entity with permission to manage staff roles', () => {
			visa = makeVisa({ canManageStaffRolesAndPermissions: true, isSystemAccount: false });
			entity = new StaffRoleTechAdminPermissions(makeProps(), visa);
		});
		When('I set canViewDatabaseExplorer to true', () => {
			entity.canViewDatabaseExplorer = true;
		});
		Then('the property should be updated to true', () => {
			expect(entity.canViewDatabaseExplorer).toBe(true);
		});
	});

	Scenario('Changing canViewDatabaseExplorer without permission', ({ Given, When, Then }) => {
		let setWithoutPermission: () => void;
		Given('a StaffRoleTechAdminPermissions entity without permission to manage staff roles or system account', () => {
			visa = makeVisa({ canManageStaffRolesAndPermissions: false, isSystemAccount: false });
			entity = new StaffRoleTechAdminPermissions(makeProps(), visa);
		});
		When('I try to set canViewDatabaseExplorer to true', () => {
			setWithoutPermission = () => {
				entity.canViewDatabaseExplorer = true;
			};
		});
		Then('a PermissionError should be thrown', () => {
			expect(setWithoutPermission).toThrow(PermissionError);
			expect(setWithoutPermission).toThrow('Cannot set permission');
		});
	});

	Scenario('Changing canViewBlobExplorer with manage staff roles permission', ({ Given, When, Then }) => {
		Given('a StaffRoleTechAdminPermissions entity with permission to manage staff roles', () => {
			visa = makeVisa({ canManageStaffRolesAndPermissions: true, isSystemAccount: false });
			entity = new StaffRoleTechAdminPermissions(makeProps(), visa);
		});
		When('I set canViewBlobExplorer to true', () => {
			entity.canViewBlobExplorer = true;
		});
		Then('the property should be updated to true', () => {
			expect(entity.canViewBlobExplorer).toBe(true);
		});
	});

	Scenario('Changing canViewBlobExplorer without permission', ({ Given, When, Then }) => {
		let setWithoutPermission: () => void;
		Given('a StaffRoleTechAdminPermissions entity without permission to manage staff roles or system account', () => {
			visa = makeVisa({ canManageStaffRolesAndPermissions: false, isSystemAccount: false });
			entity = new StaffRoleTechAdminPermissions(makeProps(), visa);
		});
		When('I try to set canViewBlobExplorer to true', () => {
			setWithoutPermission = () => {
				entity.canViewBlobExplorer = true;
			};
		});
		Then('a PermissionError should be thrown', () => {
			expect(setWithoutPermission).toThrow(PermissionError);
			expect(setWithoutPermission).toThrow('Cannot set permission');
		});
	});

	Scenario('Changing canViewQueueDashboard with manage staff roles permission', ({ Given, When, Then }) => {
		Given('a StaffRoleTechAdminPermissions entity with permission to manage staff roles', () => {
			visa = makeVisa({ canManageStaffRolesAndPermissions: true, isSystemAccount: false });
			entity = new StaffRoleTechAdminPermissions(makeProps(), visa);
		});
		When('I set canViewQueueDashboard to true', () => {
			entity.canViewQueueDashboard = true;
		});
		Then('the property should be updated to true', () => {
			expect(entity.canViewQueueDashboard).toBe(true);
		});
	});

	Scenario('Changing canViewQueueDashboard without permission', ({ Given, When, Then }) => {
		let setWithoutPermission: () => void;
		Given('a StaffRoleTechAdminPermissions entity without permission to manage staff roles or system account', () => {
			visa = makeVisa({ canManageStaffRolesAndPermissions: false, isSystemAccount: false });
			entity = new StaffRoleTechAdminPermissions(makeProps(), visa);
		});
		When('I try to set canViewQueueDashboard to true', () => {
			setWithoutPermission = () => {
				entity.canViewQueueDashboard = true;
			};
		});
		Then('a PermissionError should be thrown', () => {
			expect(setWithoutPermission).toThrow(PermissionError);
			expect(setWithoutPermission).toThrow('Cannot set permission');
		});
	});

	Scenario('Changing canSendQueueMessages with manage staff roles permission', ({ Given, When, Then }) => {
		Given('a StaffRoleTechAdminPermissions entity with permission to manage staff roles', () => {
			visa = makeVisa({ canManageStaffRolesAndPermissions: true, isSystemAccount: false });
			entity = new StaffRoleTechAdminPermissions(makeProps(), visa);
		});
		When('I set canSendQueueMessages to true', () => {
			entity.canSendQueueMessages = true;
		});
		Then('the property should be updated to true', () => {
			expect(entity.canSendQueueMessages).toBe(true);
		});
	});

	Scenario('Changing canSendQueueMessages without permission', ({ Given, When, Then }) => {
		let setWithoutPermission: () => void;
		Given('a StaffRoleTechAdminPermissions entity without permission to manage staff roles or system account', () => {
			visa = makeVisa({ canManageStaffRolesAndPermissions: false, isSystemAccount: false });
			entity = new StaffRoleTechAdminPermissions(makeProps(), visa);
		});
		When('I try to set canSendQueueMessages to true', () => {
			setWithoutPermission = () => {
				entity.canSendQueueMessages = true;
			};
		});
		Then('a PermissionError should be thrown', () => {
			expect(setWithoutPermission).toThrow(PermissionError);
			expect(setWithoutPermission).toThrow('Cannot set permission');
		});
	});
});
