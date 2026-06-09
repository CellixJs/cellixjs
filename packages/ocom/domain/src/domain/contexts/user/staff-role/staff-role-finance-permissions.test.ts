import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import { expect, vi } from 'vitest';
import { StaffRoleFinancePermissions } from './staff-role-finance-permissions.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/staff-role-finance-permissions.feature'));

function makeVisa({ canManageStaffRolesAndPermissions = true, isSystemAccount = false } = {}) {
	return vi.mocked({
		determineIf: vi.fn((fn) => fn({ canManageStaffRolesAndPermissions, isSystemAccount })),
	});
}

function makeProps(overrides = {}) {
	return {
		canManageFinance: false,
		canViewGLBatchSummaries: false,
		canViewFinanceConfigs: false,
		canCreateFinanceConfigs: false,
		...overrides,
	};
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let visa: ReturnType<typeof makeVisa>;
	let props: ReturnType<typeof makeProps>;
	let entity: StaffRoleFinancePermissions;

	BeforeEachScenario(() => {
		visa = makeVisa();
		props = makeProps();
		entity = new StaffRoleFinancePermissions(props, visa);
	});

	Background(({ Given, And }) => {
		Given('valid StaffRoleFinancePermissionsProps with all permission flags set to false', () => {
			props = makeProps();
		});
		And('a valid UserVisa', () => {
			visa = makeVisa();
		});
	});

	Scenario('Changing canManageFinance with manage staff roles permission', ({ Given, When, Then }) => {
		Given('a StaffRoleFinancePermissions entity with permission to manage staff roles', () => {
			visa = makeVisa({ canManageStaffRolesAndPermissions: true, isSystemAccount: false });
			entity = new StaffRoleFinancePermissions(makeProps(), visa);
		});
		When('I set canManageFinance to true', () => {
			entity.canManageFinance = true;
		});
		Then('the property should be updated to true', () => {
			expect(entity.canManageFinance).toBe(true);
		});
	});

	Scenario('Changing canManageFinance with system account permission', ({ Given, When, Then }) => {
		Given('a StaffRoleFinancePermissions entity with system account permission', () => {
			visa = makeVisa({ canManageStaffRolesAndPermissions: false, isSystemAccount: true });
			entity = new StaffRoleFinancePermissions(makeProps(), visa);
		});
		When('I set canManageFinance to true', () => {
			entity.canManageFinance = true;
		});
		Then('the property should be updated to true', () => {
			expect(entity.canManageFinance).toBe(true);
		});
	});

	Scenario('Changing canManageFinance without permission', ({ Given, When, Then }) => {
		let setWithoutPermission: () => void;
		Given('a StaffRoleFinancePermissions entity without permission to manage staff roles or system account', () => {
			visa = makeVisa({ canManageStaffRolesAndPermissions: false, isSystemAccount: false });
			entity = new StaffRoleFinancePermissions(makeProps(), visa);
		});
		When('I try to set canManageFinance to true', () => {
			setWithoutPermission = () => {
				entity.canManageFinance = true;
			};
		});
		Then('a PermissionError should be thrown', () => {
			expect(setWithoutPermission).toThrow(PermissionError);
			expect(setWithoutPermission).toThrow('Cannot set permission');
		});
	});

	Scenario('Changing canViewGLBatchSummaries with manage staff roles permission', ({ Given, When, Then }) => {
		Given('a StaffRoleFinancePermissions entity with permission to manage staff roles', () => {
			visa = makeVisa({ canManageStaffRolesAndPermissions: true, isSystemAccount: false });
			entity = new StaffRoleFinancePermissions(makeProps(), visa);
		});
		When('I set canViewGLBatchSummaries to true', () => {
			entity.canViewGLBatchSummaries = true;
		});
		Then('the property should be updated to true', () => {
			expect(entity.canViewGLBatchSummaries).toBe(true);
		});
	});

	Scenario('Changing canViewGLBatchSummaries without permission', ({ Given, When, Then }) => {
		let setWithoutPermission: () => void;
		Given('a StaffRoleFinancePermissions entity without permission to manage staff roles or system account', () => {
			visa = makeVisa({ canManageStaffRolesAndPermissions: false, isSystemAccount: false });
			entity = new StaffRoleFinancePermissions(makeProps(), visa);
		});
		When('I try to set canViewGLBatchSummaries to true', () => {
			setWithoutPermission = () => {
				entity.canViewGLBatchSummaries = true;
			};
		});
		Then('a PermissionError should be thrown', () => {
			expect(setWithoutPermission).toThrow(PermissionError);
			expect(setWithoutPermission).toThrow('Cannot set permission');
		});
	});

	Scenario('Changing canViewFinanceConfigs with manage staff roles permission', ({ Given, When, Then }) => {
		Given('a StaffRoleFinancePermissions entity with permission to manage staff roles', () => {
			visa = makeVisa({ canManageStaffRolesAndPermissions: true, isSystemAccount: false });
			entity = new StaffRoleFinancePermissions(makeProps(), visa);
		});
		When('I set canViewFinanceConfigs to true', () => {
			entity.canViewFinanceConfigs = true;
		});
		Then('the property should be updated to true', () => {
			expect(entity.canViewFinanceConfigs).toBe(true);
		});
	});

	Scenario('Changing canViewFinanceConfigs without permission', ({ Given, When, Then }) => {
		let setWithoutPermission: () => void;
		Given('a StaffRoleFinancePermissions entity without permission to manage staff roles or system account', () => {
			visa = makeVisa({ canManageStaffRolesAndPermissions: false, isSystemAccount: false });
			entity = new StaffRoleFinancePermissions(makeProps(), visa);
		});
		When('I try to set canViewFinanceConfigs to true', () => {
			setWithoutPermission = () => {
				entity.canViewFinanceConfigs = true;
			};
		});
		Then('a PermissionError should be thrown', () => {
			expect(setWithoutPermission).toThrow(PermissionError);
			expect(setWithoutPermission).toThrow('Cannot set permission');
		});
	});

	Scenario('Changing canCreateFinanceConfigs with manage staff roles permission', ({ Given, When, Then }) => {
		Given('a StaffRoleFinancePermissions entity with permission to manage staff roles', () => {
			visa = makeVisa({ canManageStaffRolesAndPermissions: true, isSystemAccount: false });
			entity = new StaffRoleFinancePermissions(makeProps(), visa);
		});
		When('I set canCreateFinanceConfigs to true', () => {
			entity.canCreateFinanceConfigs = true;
		});
		Then('the property should be updated to true', () => {
			expect(entity.canCreateFinanceConfigs).toBe(true);
		});
	});

	Scenario('Changing canCreateFinanceConfigs without permission', ({ Given, When, Then }) => {
		let setWithoutPermission: () => void;
		Given('a StaffRoleFinancePermissions entity without permission to manage staff roles or system account', () => {
			visa = makeVisa({ canManageStaffRolesAndPermissions: false, isSystemAccount: false });
			entity = new StaffRoleFinancePermissions(makeProps(), visa);
		});
		When('I try to set canCreateFinanceConfigs to true', () => {
			setWithoutPermission = () => {
				entity.canCreateFinanceConfigs = true;
			};
		});
		Then('a PermissionError should be thrown', () => {
			expect(setWithoutPermission).toThrow(PermissionError);
			expect(setWithoutPermission).toThrow('Cannot set permission');
		});
	});
});
