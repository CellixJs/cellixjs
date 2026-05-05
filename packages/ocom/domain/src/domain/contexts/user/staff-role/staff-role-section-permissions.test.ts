import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import { expect, vi } from 'vitest';

import { StaffRoleSectionPermissions } from './staff-role-section-permissions.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/staff-role-section-permissions.feature'));

function makeVisa({ canManageStaffRolesAndPermissions = true, isSystemAccount = false } = {}) {
	return vi.mocked({
		determineIf: vi.fn((fn) => fn({ canManageStaffRolesAndPermissions, isSystemAccount })),
	});
}

function makeProps(overrides = {}) {
	return {
		canManageCommunities: false,
		canManageUser: false,
		canManageFinance: false,
		canManageTechAdmin: false,
		...overrides,
	};
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let visa: ReturnType<typeof makeVisa>;
	let props: ReturnType<typeof makeProps>;
	let entity: StaffRoleSectionPermissions;

	BeforeEachScenario(() => {
		visa = makeVisa();
		props = makeProps();
		entity = new StaffRoleSectionPermissions(props, visa);
	});

	Background(({ Given, And }) => {
		Given('valid StaffRoleSectionPermissionsProps with all permission flags set to false', () => {
			props = makeProps();
		});
		And('a valid UserVisa', () => {
			visa = makeVisa();
		});
	});

	// canManageCommunities
	Scenario('Changing canManageCommunities with manage staff roles permission', ({ Given, When, Then }) => {
		Given('a StaffRoleSectionPermissions entity with permission to manage staff roles', () => {
			visa = makeVisa({ canManageStaffRolesAndPermissions: true, isSystemAccount: false });
			entity = new StaffRoleSectionPermissions(makeProps(), visa);
		});
		When('I set canManageCommunities to true', () => {
			entity.canManageCommunities = true;
		});
		Then('the property should be updated to true', () => {
			expect(entity.canManageCommunities).toBe(true);
		});
	});

	Scenario('Changing canManageCommunities with system account permission', ({ Given, When, Then }) => {
		Given('a StaffRoleSectionPermissions entity with system account permission', () => {
			visa = makeVisa({ canManageStaffRolesAndPermissions: false, isSystemAccount: true });
			entity = new StaffRoleSectionPermissions(makeProps(), visa);
		});
		When('I set canManageCommunities to true', () => {
			entity.canManageCommunities = true;
		});
		Then('the property should be updated to true', () => {
			expect(entity.canManageCommunities).toBe(true);
		});
	});

	Scenario('Changing canManageCommunities without permission', ({ Given, When, Then }) => {
		let setWithoutPermission: () => void;
		Given('a StaffRoleSectionPermissions entity without permission to manage staff roles or system account', () => {
			visa = makeVisa({ canManageStaffRolesAndPermissions: false, isSystemAccount: false });
			entity = new StaffRoleSectionPermissions(makeProps(), visa);
		});
		When('I try to set canManageCommunities to true', () => {
			setWithoutPermission = () => {
				entity.canManageCommunities = true;
			};
		});
		Then('a PermissionError should be thrown', () => {
			expect(setWithoutPermission).toThrow(PermissionError);
			expect(setWithoutPermission).toThrow('Cannot set permission');
		});
	});

	// canManageUser
	Scenario('Changing canManageUser with manage staff roles permission', ({ Given, When, Then }) => {
		Given('a StaffRoleSectionPermissions entity with permission to manage staff roles', () => {
			visa = makeVisa({ canManageStaffRolesAndPermissions: true, isSystemAccount: false });
			entity = new StaffRoleSectionPermissions(makeProps(), visa);
		});
		When('I set canManageUser to true', () => {
			entity.canManageUser = true;
		});
		Then('the property should be updated to true', () => {
			expect(entity.canManageUser).toBe(true);
		});
	});

	Scenario('Changing canManageUser with system account permission', ({ Given, When, Then }) => {
		Given('a StaffRoleSectionPermissions entity with system account permission', () => {
			visa = makeVisa({ canManageStaffRolesAndPermissions: false, isSystemAccount: true });
			entity = new StaffRoleSectionPermissions(makeProps(), visa);
		});
		When('I set canManageUser to true', () => {
			entity.canManageUser = true;
		});
		Then('the property should be updated to true', () => {
			expect(entity.canManageUser).toBe(true);
		});
	});

	Scenario('Changing canManageUser without permission', ({ Given, When, Then }) => {
		let setWithoutPermission: () => void;
		Given('a StaffRoleSectionPermissions entity without permission to manage staff roles or system account', () => {
			visa = makeVisa({ canManageStaffRolesAndPermissions: false, isSystemAccount: false });
			entity = new StaffRoleSectionPermissions(makeProps(), visa);
		});
		When('I try to set canManageUser to true', () => {
			setWithoutPermission = () => {
				entity.canManageUser = true;
			};
		});
		Then('a PermissionError should be thrown', () => {
			expect(setWithoutPermission).toThrow(PermissionError);
			expect(setWithoutPermission).toThrow('Cannot set permission');
		});
	});

	// canManageFinance
	Scenario('Changing canManageFinance with manage staff roles permission', ({ Given, When, Then }) => {
		Given('a StaffRoleSectionPermissions entity with permission to manage staff roles', () => {
			visa = makeVisa({ canManageStaffRolesAndPermissions: true, isSystemAccount: false });
			entity = new StaffRoleSectionPermissions(makeProps(), visa);
		});
		When('I set canManageFinance to true', () => {
			entity.canManageFinance = true;
		});
		Then('the property should be updated to true', () => {
			expect(entity.canManageFinance).toBe(true);
		});
	});

	Scenario('Changing canManageFinance with system account permission', ({ Given, When, Then }) => {
		Given('a StaffRoleSectionPermissions entity with system account permission', () => {
			visa = makeVisa({ canManageStaffRolesAndPermissions: false, isSystemAccount: true });
			entity = new StaffRoleSectionPermissions(makeProps(), visa);
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
		Given('a StaffRoleSectionPermissions entity without permission to manage staff roles or system account', () => {
			visa = makeVisa({ canManageStaffRolesAndPermissions: false, isSystemAccount: false });
			entity = new StaffRoleSectionPermissions(makeProps(), visa);
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

	// canManageTechAdmin
	Scenario('Changing canManageTechAdmin with manage staff roles permission', ({ Given, When, Then }) => {
		Given('a StaffRoleSectionPermissions entity with permission to manage staff roles', () => {
			visa = makeVisa({ canManageStaffRolesAndPermissions: true, isSystemAccount: false });
			entity = new StaffRoleSectionPermissions(makeProps(), visa);
		});
		When('I set canManageTechAdmin to true', () => {
			entity.canManageTechAdmin = true;
		});
		Then('the property should be updated to true', () => {
			expect(entity.canManageTechAdmin).toBe(true);
		});
	});

	Scenario('Changing canManageTechAdmin with system account permission', ({ Given, When, Then }) => {
		Given('a StaffRoleSectionPermissions entity with system account permission', () => {
			visa = makeVisa({ canManageStaffRolesAndPermissions: false, isSystemAccount: true });
			entity = new StaffRoleSectionPermissions(makeProps(), visa);
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
		Given('a StaffRoleSectionPermissions entity without permission to manage staff roles or system account', () => {
			visa = makeVisa({ canManageStaffRolesAndPermissions: false, isSystemAccount: false });
			entity = new StaffRoleSectionPermissions(makeProps(), visa);
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
});
