import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import { expect, vi } from 'vitest';

import { StaffRoleViolationTicketPermissions } from './staff-role-violation-ticket-permissions.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(
		__dirname,
		'features/staff-role-violation-ticket-permissions.feature',
	),
);

function makeVisa({
	canManageStaffRolesAndPermissions = true,
	isSystemAccount = false,
} = {}) {
	return vi.mocked({
		determineIf: vi.fn((fn) =>
			fn({ canManageStaffRolesAndPermissions, isSystemAccount }),
		),
	});
}

function makeProps(overrides = {}) {
	return {
		canCreateTickets: false,
		canManageTickets: false,
		canAssignTickets: false,
		canWorkOnTickets: false,
		...overrides,
	};
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let visa: ReturnType<typeof makeVisa>;
	let props: ReturnType<typeof makeProps>;
	let entity: StaffRoleViolationTicketPermissions;

	BeforeEachScenario(() => {
		visa = makeVisa();
		props = makeProps();
		entity = new StaffRoleViolationTicketPermissions(props, visa);
	});

	Background(({ Given, And }) => {
		Given(
			'valid StaffRoleViolationTicketPermissionsProps with all permission flags set to false',
			() => {
				props = makeProps();
			},
		);
		And('a valid UserVisa', () => {
			visa = makeVisa();
		});
	});

	// canCreateTickets
	Scenario(
		'Changing canCreateTickets with manage staff roles permission',
		({ Given, When, Then }) => {
			Given(
				'a StaffRoleViolationTicketPermissions entity with permission to manage staff roles',
				() => {
					visa = makeVisa({
						canManageStaffRolesAndPermissions: true,
						isSystemAccount: false,
					});
					entity = new StaffRoleViolationTicketPermissions(makeProps(), visa);
				},
			);
			When('I set canCreateTickets to true', () => {
				entity.canCreateTickets = true;
			});
			Then('the property should be updated to true', () => {
				expect(entity.canCreateTickets).toBe(true);
			});
		},
	);

	Scenario(
		'Changing canCreateTickets with system account permission',
		({ Given, When, Then }) => {
			Given(
				'a StaffRoleViolationTicketPermissions entity with system account permission',
				() => {
					visa = makeVisa({
						canManageStaffRolesAndPermissions: false,
						isSystemAccount: true,
					});
					entity = new StaffRoleViolationTicketPermissions(makeProps(), visa);
				},
			);
			When('I set canCreateTickets to true', () => {
				entity.canCreateTickets = true;
			});
			Then('the property should be updated to true', () => {
				expect(entity.canCreateTickets).toBe(true);
			});
		},
	);

	Scenario(
		'Changing canCreateTickets without permission',
		({ Given, When, Then }) => {
			let setWithoutPermission: () => void;
			Given(
				'a StaffRoleViolationTicketPermissions entity without permission to manage staff roles or system account',
				() => {
					visa = makeVisa({
						canManageStaffRolesAndPermissions: false,
						isSystemAccount: false,
					});
					entity = new StaffRoleViolationTicketPermissions(makeProps(), visa);
				},
			);
			When('I try to set canCreateTickets to true', () => {
				setWithoutPermission = () => {
					entity.canCreateTickets = true;
				};
			});
			Then('a PermissionError should be thrown', () => {
				expect(setWithoutPermission).toThrow(PermissionError);
				expect(setWithoutPermission).toThrow('Cannot set permission');
			});
		},
	);

	// canManageTickets
	Scenario(
		'Changing canManageTickets with manage staff roles permission',
		({ Given, When, Then }) => {
			Given(
				'a StaffRoleViolationTicketPermissions entity with permission to manage staff roles',
				() => {
					visa = makeVisa({
						canManageStaffRolesAndPermissions: true,
						isSystemAccount: false,
					});
					entity = new StaffRoleViolationTicketPermissions(makeProps(), visa);
				},
			);
			When('I set canManageTickets to true', () => {
				entity.canManageTickets = true;
			});
			Then('the property should be updated to true', () => {
				expect(entity.canManageTickets).toBe(true);
			});
		},
	);

	Scenario(
		'Changing canManageTickets with system account permission',
		({ Given, When, Then }) => {
			Given(
				'a StaffRoleViolationTicketPermissions entity with system account permission',
				() => {
					visa = makeVisa({
						canManageStaffRolesAndPermissions: false,
						isSystemAccount: true,
					});
					entity = new StaffRoleViolationTicketPermissions(makeProps(), visa);
				},
			);
			When('I set canManageTickets to true', () => {
				entity.canManageTickets = true;
			});
			Then('the property should be updated to true', () => {
				expect(entity.canManageTickets).toBe(true);
			});
		},
	);

	Scenario(
		'Changing canManageTickets without permission',
		({ Given, When, Then }) => {
			let setWithoutPermission: () => void;
			Given(
				'a StaffRoleViolationTicketPermissions entity without permission to manage staff roles or system account',
				() => {
					visa = makeVisa({
						canManageStaffRolesAndPermissions: false,
						isSystemAccount: false,
					});
					entity = new StaffRoleViolationTicketPermissions(makeProps(), visa);
				},
			);
			When('I try to set canManageTickets to true', () => {
				setWithoutPermission = () => {
					entity.canManageTickets = true;
				};
			});
			Then('a PermissionError should be thrown', () => {
				expect(setWithoutPermission).toThrow(PermissionError);
				expect(setWithoutPermission).toThrow('Cannot set permission');
			});
		},
	);

	// canAssignTickets
	Scenario(
		'Changing canAssignTickets with manage staff roles permission',
		({ Given, When, Then }) => {
			Given(
				'a StaffRoleViolationTicketPermissions entity with permission to manage staff roles',
				() => {
					visa = makeVisa({
						canManageStaffRolesAndPermissions: true,
						isSystemAccount: false,
					});
					entity = new StaffRoleViolationTicketPermissions(makeProps(), visa);
				},
			);
			When('I set canAssignTickets to true', () => {
				entity.canAssignTickets = true;
			});
			Then('the property should be updated to true', () => {
				expect(entity.canAssignTickets).toBe(true);
			});
		},
	);

	Scenario(
		'Changing canAssignTickets with system account permission',
		({ Given, When, Then }) => {
			Given(
				'a StaffRoleViolationTicketPermissions entity with system account permission',
				() => {
					visa = makeVisa({
						canManageStaffRolesAndPermissions: false,
						isSystemAccount: true,
					});
					entity = new StaffRoleViolationTicketPermissions(makeProps(), visa);
				},
			);
			When('I set canAssignTickets to true', () => {
				entity.canAssignTickets = true;
			});
			Then('the property should be updated to true', () => {
				expect(entity.canAssignTickets).toBe(true);
			});
		},
	);

	Scenario(
		'Changing canAssignTickets without permission',
		({ Given, When, Then }) => {
			let setWithoutPermission: () => void;
			Given(
				'a StaffRoleViolationTicketPermissions entity without permission to manage staff roles or system account',
				() => {
					visa = makeVisa({
						canManageStaffRolesAndPermissions: false,
						isSystemAccount: false,
					});
					entity = new StaffRoleViolationTicketPermissions(makeProps(), visa);
				},
			);
			When('I try to set canAssignTickets to true', () => {
				setWithoutPermission = () => {
					entity.canAssignTickets = true;
				};
			});
			Then('a PermissionError should be thrown', () => {
				expect(setWithoutPermission).toThrow(PermissionError);
				expect(setWithoutPermission).toThrow('Cannot set permission');
			});
		},
	);

	// canWorkOnTickets
	Scenario(
		'Changing canWorkOnTickets with manage staff roles permission',
		({ Given, When, Then }) => {
			Given(
				'a StaffRoleViolationTicketPermissions entity with permission to manage staff roles',
				() => {
					visa = makeVisa({
						canManageStaffRolesAndPermissions: true,
						isSystemAccount: false,
					});
					entity = new StaffRoleViolationTicketPermissions(makeProps(), visa);
				},
			);
			When('I set canWorkOnTickets to true', () => {
				entity.canWorkOnTickets = true;
			});
			Then('the property should be updated to true', () => {
				expect(entity.canWorkOnTickets).toBe(true);
			});
		},
	);

	Scenario(
		'Changing canWorkOnTickets with system account permission',
		({ Given, When, Then }) => {
			Given(
				'a StaffRoleViolationTicketPermissions entity with system account permission',
				() => {
					visa = makeVisa({
						canManageStaffRolesAndPermissions: false,
						isSystemAccount: true,
					});
					entity = new StaffRoleViolationTicketPermissions(makeProps(), visa);
				},
			);
			When('I set canWorkOnTickets to true', () => {
				entity.canWorkOnTickets = true;
			});
			Then('the property should be updated to true', () => {
				expect(entity.canWorkOnTickets).toBe(true);
			});
		},
	);

	Scenario(
		'Changing canWorkOnTickets without permission',
		({ Given, When, Then }) => {
			let setWithoutPermission: () => void;
			Given(
				'a StaffRoleViolationTicketPermissions entity without permission to manage staff roles or system account',
				() => {
					visa = makeVisa({
						canManageStaffRolesAndPermissions: false,
						isSystemAccount: false,
					});
					entity = new StaffRoleViolationTicketPermissions(makeProps(), visa);
				},
			);
			When('I try to set canWorkOnTickets to true', () => {
				setWithoutPermission = () => {
					entity.canWorkOnTickets = true;
				};
			});
			Then('a PermissionError should be thrown', () => {
				expect(setWithoutPermission).toThrow(PermissionError);
				expect(setWithoutPermission).toThrow('Cannot set permission');
			});
		},
	);
});
