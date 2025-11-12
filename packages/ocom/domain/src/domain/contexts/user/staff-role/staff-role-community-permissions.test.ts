import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import { expect, vi } from 'vitest';
import { StaffRoleCommunityPermissions } from './staff-role-community-permissions.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(__dirname, 'features/staff-role-community-permissions.feature'),
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
		canManageStaffRolesAndPermissions: false,
		canManageAllCommunities: false,
		canDeleteCommunities: false,
		canChangeCommunityOwner: false,
		canReIndexSearchCollections: false,
		...overrides,
	};
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let visa: ReturnType<typeof makeVisa>;
	let props: ReturnType<typeof makeProps>;
	let entity: StaffRoleCommunityPermissions;

	BeforeEachScenario(() => {
		visa = makeVisa();
		props = makeProps();
		entity = new StaffRoleCommunityPermissions(props, visa);
	});

	Background(({ Given, And }) => {
		Given(
			'valid StaffRoleCommunityPermissionsProps with all permission flags set to false',
			() => {
				props = makeProps();
			},
		);
		And('a valid UserVisa', () => {
			visa = makeVisa();
		});
	});

	// canManageStaffRolesAndPermissions
	Scenario(
		'Changing canManageStaffRolesAndPermissions with manage staff roles permission',
		({ Given, When, Then }) => {
			Given(
				'a StaffRoleCommunityPermissions entity with permission to manage staff roles',
				() => {
					visa = makeVisa({
						canManageStaffRolesAndPermissions: true,
						isSystemAccount: false,
					});
					entity = new StaffRoleCommunityPermissions(makeProps(), visa);
				},
			);
			When('I set canManageStaffRolesAndPermissions to true', () => {
				entity.canManageStaffRolesAndPermissions = true;
			});
			Then('the property should be updated to true', () => {
				expect(entity.canManageStaffRolesAndPermissions).toBe(true);
			});
		},
	);

	Scenario(
		'Changing canManageStaffRolesAndPermissions with system account permission',
		({ Given, When, Then }) => {
			Given(
				'a StaffRoleCommunityPermissions entity with system account permission',
				() => {
					visa = makeVisa({
						canManageStaffRolesAndPermissions: false,
						isSystemAccount: true,
					});
					entity = new StaffRoleCommunityPermissions(makeProps(), visa);
				},
			);
			When('I set canManageStaffRolesAndPermissions to true', () => {
				entity.canManageStaffRolesAndPermissions = true;
			});
			Then('the property should be updated to true', () => {
				expect(entity.canManageStaffRolesAndPermissions).toBe(true);
			});
		},
	);

	Scenario(
		'Changing canManageStaffRolesAndPermissions without permission',
		({ Given, When, Then }) => {
			let setWithoutPermission: () => void;
			Given(
				'a StaffRoleCommunityPermissions entity without permission to manage staff roles or system account',
				() => {
					visa = makeVisa({
						canManageStaffRolesAndPermissions: false,
						isSystemAccount: false,
					});
					entity = new StaffRoleCommunityPermissions(makeProps(), visa);
				},
			);
			When('I try to set canManageStaffRolesAndPermissions to true', () => {
				setWithoutPermission = () => {
					entity.canManageStaffRolesAndPermissions = true;
				};
			});
			Then('a PermissionError should be thrown', () => {
				expect(setWithoutPermission).toThrow(DomainSeedwork.PermissionError);
				expect(setWithoutPermission).toThrow('Cannot set permission');
			});
		},
	);

	// canManageAllCommunities
	Scenario(
		'Changing canManageAllCommunities with manage staff roles permission',
		({ Given, When, Then }) => {
			Given(
				'a StaffRoleCommunityPermissions entity with permission to manage staff roles',
				() => {
					visa = makeVisa({
						canManageStaffRolesAndPermissions: true,
						isSystemAccount: false,
					});
					entity = new StaffRoleCommunityPermissions(makeProps(), visa);
				},
			);
			When('I set canManageAllCommunities to true', () => {
				entity.canManageAllCommunities = true;
			});
			Then('the property should be updated to true', () => {
				expect(entity.canManageAllCommunities).toBe(true);
			});
		},
	);

	Scenario(
		'Changing canManageAllCommunities with system account permission',
		({ Given, When, Then }) => {
			Given(
				'a StaffRoleCommunityPermissions entity with system account permission',
				() => {
					visa = makeVisa({
						canManageStaffRolesAndPermissions: false,
						isSystemAccount: true,
					});
					entity = new StaffRoleCommunityPermissions(makeProps(), visa);
				},
			);
			When('I set canManageAllCommunities to true', () => {
				entity.canManageAllCommunities = true;
			});
			Then('the property should be updated to true', () => {
				expect(entity.canManageAllCommunities).toBe(true);
			});
		},
	);

	Scenario(
		'Changing canManageAllCommunities without permission',
		({ Given, When, Then }) => {
			let setWithoutPermission: () => void;
			Given(
				'a StaffRoleCommunityPermissions entity without permission to manage staff roles or system account',
				() => {
					visa = makeVisa({
						canManageStaffRolesAndPermissions: false,
						isSystemAccount: false,
					});
					entity = new StaffRoleCommunityPermissions(makeProps(), visa);
				},
			);
			When('I try to set canManageAllCommunities to true', () => {
				setWithoutPermission = () => {
					entity.canManageAllCommunities = true;
				};
			});
			Then('a PermissionError should be thrown', () => {
				expect(setWithoutPermission).toThrow(DomainSeedwork.PermissionError);
				expect(setWithoutPermission).toThrow('Cannot set permission');
			});
		},
	);

	// canDeleteCommunities
	Scenario(
		'Changing canDeleteCommunities with manage staff roles permission',
		({ Given, When, Then }) => {
			Given(
				'a StaffRoleCommunityPermissions entity with permission to manage staff roles',
				() => {
					visa = makeVisa({
						canManageStaffRolesAndPermissions: true,
						isSystemAccount: false,
					});
					entity = new StaffRoleCommunityPermissions(makeProps(), visa);
				},
			);
			When('I set canDeleteCommunities to true', () => {
				entity.canDeleteCommunities = true;
			});
			Then('the property should be updated to true', () => {
				expect(entity.canDeleteCommunities).toBe(true);
			});
		},
	);

	Scenario(
		'Changing canDeleteCommunities with system account permission',
		({ Given, When, Then }) => {
			Given(
				'a StaffRoleCommunityPermissions entity with system account permission',
				() => {
					visa = makeVisa({
						canManageStaffRolesAndPermissions: false,
						isSystemAccount: true,
					});
					entity = new StaffRoleCommunityPermissions(makeProps(), visa);
				},
			);
			When('I set canDeleteCommunities to true', () => {
				entity.canDeleteCommunities = true;
			});
			Then('the property should be updated to true', () => {
				expect(entity.canDeleteCommunities).toBe(true);
			});
		},
	);

	Scenario(
		'Changing canDeleteCommunities without permission',
		({ Given, When, Then }) => {
			let setWithoutPermission: () => void;
			Given(
				'a StaffRoleCommunityPermissions entity without permission to manage staff roles or system account',
				() => {
					visa = makeVisa({
						canManageStaffRolesAndPermissions: false,
						isSystemAccount: false,
					});
					entity = new StaffRoleCommunityPermissions(makeProps(), visa);
				},
			);
			When('I try to set canDeleteCommunities to true', () => {
				setWithoutPermission = () => {
					entity.canDeleteCommunities = true;
				};
			});
			Then('a PermissionError should be thrown', () => {
				expect(setWithoutPermission).toThrow(DomainSeedwork.PermissionError);
				expect(setWithoutPermission).toThrow('Cannot set permission');
			});
		},
	);

	// canChangeCommunityOwner
	Scenario(
		'Changing canChangeCommunityOwner with manage staff roles permission',
		({ Given, When, Then }) => {
			Given(
				'a StaffRoleCommunityPermissions entity with permission to manage staff roles',
				() => {
					visa = makeVisa({
						canManageStaffRolesAndPermissions: true,
						isSystemAccount: false,
					});
					entity = new StaffRoleCommunityPermissions(makeProps(), visa);
				},
			);
			When('I set canChangeCommunityOwner to true', () => {
				entity.canChangeCommunityOwner = true;
			});
			Then('the property should be updated to true', () => {
				expect(entity.canChangeCommunityOwner).toBe(true);
			});
		},
	);

	Scenario(
		'Changing canChangeCommunityOwner with system account permission',
		({ Given, When, Then }) => {
			Given(
				'a StaffRoleCommunityPermissions entity with system account permission',
				() => {
					visa = makeVisa({
						canManageStaffRolesAndPermissions: false,
						isSystemAccount: true,
					});
					entity = new StaffRoleCommunityPermissions(makeProps(), visa);
				},
			);
			When('I set canChangeCommunityOwner to true', () => {
				entity.canChangeCommunityOwner = true;
			});
			Then('the property should be updated to true', () => {
				expect(entity.canChangeCommunityOwner).toBe(true);
			});
		},
	);

	Scenario(
		'Changing canChangeCommunityOwner without permission',
		({ Given, When, Then }) => {
			let setWithoutPermission: () => void;
			Given(
				'a StaffRoleCommunityPermissions entity without permission to manage staff roles or system account',
				() => {
					visa = makeVisa({
						canManageStaffRolesAndPermissions: false,
						isSystemAccount: false,
					});
					entity = new StaffRoleCommunityPermissions(makeProps(), visa);
				},
			);
			When('I try to set canChangeCommunityOwner to true', () => {
				setWithoutPermission = () => {
					entity.canChangeCommunityOwner = true;
				};
			});
			Then('a PermissionError should be thrown', () => {
				expect(setWithoutPermission).toThrow(DomainSeedwork.PermissionError);
				expect(setWithoutPermission).toThrow('Cannot set permission');
			});
		},
	);

	// canReIndexSearchCollections
	Scenario(
		'Changing canReIndexSearchCollections with manage staff roles permission',
		({ Given, When, Then }) => {
			Given(
				'a StaffRoleCommunityPermissions entity with permission to manage staff roles',
				() => {
					visa = makeVisa({
						canManageStaffRolesAndPermissions: true,
						isSystemAccount: false,
					});
					entity = new StaffRoleCommunityPermissions(makeProps(), visa);
				},
			);
			When('I set canReIndexSearchCollections to true', () => {
				entity.canReIndexSearchCollections = true;
			});
			Then('the property should be updated to true', () => {
				expect(entity.canReIndexSearchCollections).toBe(true);
			});
		},
	);

	Scenario(
		'Changing canReIndexSearchCollections with system account permission',
		({ Given, When, Then }) => {
			Given(
				'a StaffRoleCommunityPermissions entity with system account permission',
				() => {
					visa = makeVisa({
						canManageStaffRolesAndPermissions: false,
						isSystemAccount: true,
					});
					entity = new StaffRoleCommunityPermissions(makeProps(), visa);
				},
			);
			When('I set canReIndexSearchCollections to true', () => {
				entity.canReIndexSearchCollections = true;
			});
			Then('the property should be updated to true', () => {
				expect(entity.canReIndexSearchCollections).toBe(true);
			});
		},
	);

	Scenario(
		'Changing canReIndexSearchCollections without permission',
		({ Given, When, Then }) => {
			let setWithoutPermission: () => void;
			Given(
				'a StaffRoleCommunityPermissions entity without permission to manage staff roles or system account',
				() => {
					visa = makeVisa({
						canManageStaffRolesAndPermissions: false,
						isSystemAccount: false,
					});
					entity = new StaffRoleCommunityPermissions(makeProps(), visa);
				},
			);
			When('I try to set canReIndexSearchCollections to true', () => {
				setWithoutPermission = () => {
					entity.canReIndexSearchCollections = true;
				};
			});
			Then('a PermissionError should be thrown', () => {
				expect(setWithoutPermission).toThrow(DomainSeedwork.PermissionError);
				expect(setWithoutPermission).toThrow('Cannot set permission');
			});
		},
	);
});
