import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import { expect, vi } from 'vitest';
import { EndUserRoleServicePermissions } from './end-user-role-service-permissions.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(__dirname, 'features/end-user-role-service-permissions.feature'),
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
		canManageServices: false,
	};
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let visa: ReturnType<typeof makeVisa>;
	let props: ReturnType<typeof makeProps>;
	let entity: EndUserRoleServicePermissions;

	BeforeEachScenario(() => {
		visa = makeVisa();
		props = makeProps();
		entity = new EndUserRoleServicePermissions(props, visa);
	});

	Background(({ Given, And }) => {
		Given(
			'valid EndUserRoleServicePermissionsProps with canManageServices set to false',
			() => {
				props = makeProps();
			},
		);
		And('a valid CommunityVisa', () => {
			visa = makeVisa();
		});
	});

	Scenario(
		'Changing canManageServices with manage end user roles permission',
		({ Given, When, Then }) => {
			Given(
				'an EndUserRoleServicePermissions entity with permission to manage end user roles',
				() => {
					visa = makeVisa({ canManageEndUserRolesAndPermissions: true });
					entity = new EndUserRoleServicePermissions(makeProps(), visa);
				},
			);
			When('I set canManageServices to true', () => {
				entity.canManageServices = true;
			});
			Then('the property should be updated to true', () => {
				expect(entity.canManageServices).toBe(true);
			});
		},
	);

	Scenario(
		'Changing canManageServices with system account permission',
		({ Given, When, Then }) => {
			Given(
				'an EndUserRoleServicePermissions entity with system account permission',
				() => {
					visa = makeVisa({
						canManageEndUserRolesAndPermissions: false,
						isSystemAccount: true,
					});
					entity = new EndUserRoleServicePermissions(makeProps(), visa);
				},
			);
			When('I set canManageServices to true', () => {
				entity.canManageServices = true;
			});
			Then('the property should be updated to true', () => {
				expect(entity.canManageServices).toBe(true);
			});
		},
	);

	Scenario(
		'Changing canManageServices without permission',
		({ Given, When, Then }) => {
			let setPermission: () => void;
			Given(
				'an EndUserRoleServicePermissions entity without permission to manage end user roles or system account',
				() => {
					visa = makeVisa({
						canManageEndUserRolesAndPermissions: false,
						isSystemAccount: false,
					});
					entity = new EndUserRoleServicePermissions(makeProps(), visa);
				},
			);
			When('I try to set canManageServices to true', () => {
				setPermission = () => {
					entity.canManageServices = true;
				};
			});
			Then('a PermissionError should be thrown', () => {
				expect(setPermission).toThrow(PermissionError);
				expect(setPermission).throws('Cannot set permission');
			});
		},
	);
});
