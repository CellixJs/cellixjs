import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import { expect, vi } from 'vitest';
import { VendorUserRoleServicePermissions } from './vendor-user-role-service-permissions.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(
		__dirname,
		'features/vendor-user-role-service-permissions.feature',
	),
);

function makeVisa(
	overrides: Partial<{
		canManageVendorUserRolesAndPermissions: boolean;
		isSystemAccount: boolean;
	}> = {},
) {
	return vi.mocked({
		determineIf: (
			fn: (p: {
				canManageVendorUserRolesAndPermissions: boolean;
				isSystemAccount: boolean;
			}) => boolean,
		) =>
			fn({
				canManageVendorUserRolesAndPermissions:
					overrides.canManageVendorUserRolesAndPermissions ?? true,
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
	let entity: VendorUserRoleServicePermissions;

	BeforeEachScenario(() => {
		visa = makeVisa();
		props = makeProps();
		entity = new VendorUserRoleServicePermissions(props, visa);
	});

	Background(({ Given, And }) => {
		Given(
			'valid VendorUserRoleServicePermissionsProps with canManageServices set to false',
			() => {
				props = makeProps();
			},
		);
		And('a valid CommunityVisa', () => {
			visa = makeVisa();
		});
	});

	Scenario(
		'Changing canManageServices with manage vendor user roles permission',
		({ Given, When, Then }) => {
			Given(
				'an VendorUserRoleServicePermissions entity with permission to manage vendor user roles',
				() => {
					visa = makeVisa({ canManageVendorUserRolesAndPermissions: true });
					entity = new VendorUserRoleServicePermissions(makeProps(), visa);
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
				'an VendorUserRoleServicePermissions entity with system account permission',
				() => {
					visa = makeVisa({
						canManageVendorUserRolesAndPermissions: false,
						isSystemAccount: true,
					});
					entity = new VendorUserRoleServicePermissions(makeProps(), visa);
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
				'an VendorUserRoleServicePermissions entity without permission to manage vendor user roles or system account',
				() => {
					visa = makeVisa({
						canManageVendorUserRolesAndPermissions: false,
						isSystemAccount: false,
					});
					entity = new VendorUserRoleServicePermissions(makeProps(), visa);
				},
			);
			When('I try to set canManageServices to true', () => {
				setPermission = () => {
					entity.canManageServices = true;
				};
			});
			Then('a PermissionError should be thrown', () => {
				expect(setPermission).toThrow(DomainSeedwork.PermissionError);
				expect(setPermission).throws('Cannot set permission');
			});
		},
	);
});
