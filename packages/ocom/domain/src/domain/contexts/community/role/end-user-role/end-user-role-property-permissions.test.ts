import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import { expect, vi } from 'vitest';
import {
	EndUserRolePropertyPermissions,
	type EndUserRolePropertyPermissionsProps,
} from './end-user-role-property-permissions.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(
		__dirname,
		'features/end-user-role-property-permissions.feature',
	),
);

function makeVisa(
	overrides: Partial<{
		canManageEndUserRolesAndPermissions: boolean;
		isSystemAccount: boolean;
	}> = {},
) {
	return vi.mocked({
		determineIf: (
			fn: (p: {
				canManageEndUserRolesAndPermissions: boolean;
				isSystemAccount: boolean;
			}) => boolean,
		) =>
			fn({
				canManageEndUserRolesAndPermissions:
					overrides.canManageEndUserRolesAndPermissions ?? true,
				isSystemAccount: overrides.isSystemAccount ?? false,
			}),
	});
}

function makeProps() {
	return {
		canManageProperties: false,
		canEditOwnProperty: false,
	// biome-ignore lint/plugin/no-type-assertion: test file
	} as EndUserRolePropertyPermissionsProps;
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let visa: ReturnType<typeof makeVisa>;
	let props: ReturnType<typeof makeProps>;
	let entity: EndUserRolePropertyPermissions;

	BeforeEachScenario(() => {
		visa = makeVisa();
		props = makeProps();
		entity = new EndUserRolePropertyPermissions(props, visa);
	});

	Background(({ Given, And }) => {
		Given(
			'valid EndUserRolePropertyPermissionsProps with canManageProperties and canEditOwnProperty set to false',
			() => {
				props = makeProps();
			},
		);
		And('a valid CommunityVisa', () => {
			visa = makeVisa();
		});
	});

	// canManageProperties
	Scenario(
		'Changing canManageProperties with manage end user roles permission',
		({ Given, When, Then }) => {
			Given(
				'an EndUserRolePropertyPermissions entity with permission to manage end user roles',
				() => {
					visa = makeVisa({ canManageEndUserRolesAndPermissions: true });
					entity = new EndUserRolePropertyPermissions(makeProps(), visa);
				},
			);
			When('I set canManageProperties to true', () => {
				entity.canManageProperties = true;
			});
			Then('the property should be updated to true', () => {
				expect(entity.canManageProperties).toBe(true);
			});
		},
	);

	Scenario(
		'Changing canManageProperties with system account permission',
		({ Given, When, Then }) => {
			Given(
				'an EndUserRolePropertyPermissions entity with system account permission',
				() => {
					visa = makeVisa({
						canManageEndUserRolesAndPermissions: false,
						isSystemAccount: true,
					});
					entity = new EndUserRolePropertyPermissions(makeProps(), visa);
				},
			);
			When('I set canManageProperties to true', () => {
				entity.canManageProperties = true;
			});
			Then('the property should be updated to true', () => {
				expect(entity.canManageProperties).toBe(true);
			});
		},
	);

	Scenario(
		'Changing canManageProperties without permission',
		({ Given, When, Then }) => {
			let setPermission: () => void;
			Given(
				'an EndUserRolePropertyPermissions entity without permission to manage end user roles or system account',
				() => {
					visa = makeVisa({
						canManageEndUserRolesAndPermissions: false,
						isSystemAccount: false,
					});
					entity = new EndUserRolePropertyPermissions(makeProps(), visa);
				},
			);
			When('I try to set canManageProperties to true', () => {
				setPermission = () => {
					entity.canManageProperties = true;
				};
			});
			Then('a PermissionError should be thrown', () => {
				expect(setPermission).toThrow(PermissionError);
				expect(setPermission).throws('Cannot set permission');
			});
		},
	);

	// canEditOwnProperty
	Scenario(
		'Changing canEditOwnProperty with manage end user roles permission',
		({ Given, When, Then }) => {
			Given(
				'an EndUserRolePropertyPermissions entity with permission to manage end user roles',
				() => {
					visa = makeVisa({ canManageEndUserRolesAndPermissions: true });
					entity = new EndUserRolePropertyPermissions(makeProps(), visa);
				},
			);
			When('I set canEditOwnProperty to true', () => {
				entity.canEditOwnProperty = true;
			});
			Then('the property should be updated to true', () => {
				expect(entity.canEditOwnProperty).toBe(true);
			});
		},
	);

	Scenario(
		'Changing canEditOwnProperty with system account permission',
		({ Given, When, Then }) => {
			Given(
				'an EndUserRolePropertyPermissions entity with system account permission',
				() => {
					visa = makeVisa({
						canManageEndUserRolesAndPermissions: false,
						isSystemAccount: true,
					});
					entity = new EndUserRolePropertyPermissions(makeProps(), visa);
				},
			);
			When('I set canEditOwnProperty to true', () => {
				entity.canEditOwnProperty = true;
			});
			Then('the property should be updated to true', () => {
				expect(entity.canEditOwnProperty).toBe(true);
			});
		},
	);

	Scenario(
		'Changing canEditOwnProperty without permission',
		({ Given, When, Then }) => {
			let setPermission: () => void;
			Given(
				'an EndUserRolePropertyPermissions entity without permission to manage end user roles or system account',
				() => {
					visa = makeVisa({
						canManageEndUserRolesAndPermissions: false,
						isSystemAccount: false,
					});
					entity = new EndUserRolePropertyPermissions(makeProps(), visa);
				},
			);
			When('I try to set canEditOwnProperty to true', () => {
				setPermission = () => {
					entity.canEditOwnProperty = true;
				};
			});
			Then('a PermissionError should be thrown', () => {
				expect(setPermission).toThrow(PermissionError);
				expect(setPermission).throws('Cannot set permission');
			});
		},
	);
});
