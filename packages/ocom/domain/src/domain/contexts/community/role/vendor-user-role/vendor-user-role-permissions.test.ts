import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import { VendorUserRoleCommunityPermissions } from './vendor-user-role-community-permissions.ts';
import { VendorUserRolePermissions } from './vendor-user-role-permissions.ts';
import { VendorUserRolePropertyPermissions } from './vendor-user-role-property-permissions.ts';
import { VendorUserRoleServicePermissions } from './vendor-user-role-service-permissions.ts';
import { VendorUserRoleServiceTicketPermissions } from './vendor-user-role-service-ticket-permissions.ts';
import { VendorUserRoleViolationTicketPermissions } from './vendor-user-role-violation-ticket-permissions.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(__dirname, 'features/vendor-user-role-permissions.feature'),
);

function makeVisa() {
	return vi.mocked({
		determineIf: vi.fn(() => true),
	});
}

function makeProps() {
	return {
		communityPermissions: {} as VendorUserRoleCommunityPermissions,
		propertyPermissions: {} as VendorUserRolePropertyPermissions,
		serviceTicketPermissions: {} as VendorUserRoleServiceTicketPermissions,
		servicePermissions: {} as VendorUserRoleServicePermissions,
		violationTicketPermissions: {} as VendorUserRoleViolationTicketPermissions,
	};
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let visa: ReturnType<typeof makeVisa>;
	let props: ReturnType<typeof makeProps>;
	let entity: VendorUserRolePermissions;

	BeforeEachScenario(() => {
		visa = makeVisa();
		props = makeProps();
		entity = new VendorUserRolePermissions(props, visa);
	});

	Background(({ Given, And }) => {
		Given(
			'valid VendorUserRolePermissionsProps with all required permission props',
			() => {
				props = makeProps();
			},
		);
		And('a valid UserVisa', () => {
			visa = makeVisa();
		});
	});

	Scenario('Accessing communityPermissions', ({ Given, When, Then }) => {
		let communityPermissions: VendorUserRoleCommunityPermissions;
		Given('a VendorUserRolePermissions entity', () => {
			entity = new VendorUserRolePermissions(props, visa);
		});
		When('I access the communityPermissions property', () => {
			communityPermissions = entity.communityPermissions;
		});
		Then(
			'I should receive a VendorUserRoleCommunityPermissions entity instance',
			() => {
				expect(communityPermissions).toBeInstanceOf(
					VendorUserRoleCommunityPermissions,
				);
			},
		);
	});

	Scenario('Accessing propertyPermissions', ({ Given, When, Then }) => {
		let propertyPermissions: VendorUserRolePropertyPermissions;
		Given('a VendorUserRolePermissions entity', () => {
			entity = new VendorUserRolePermissions(props, visa);
		});
		When('I access the propertyPermissions property', () => {
			propertyPermissions = entity.propertyPermissions;
		});
		Then(
			'I should receive a VendorUserRolePropertyPermissions entity instance',
			() => {
				expect(propertyPermissions).toBeInstanceOf(
					VendorUserRolePropertyPermissions,
				);
			},
		);
	});

	Scenario('Accessing serviceTicketPermissions', ({ Given, When, Then }) => {
		let serviceTicketPermissions: VendorUserRoleServiceTicketPermissions;
		Given('a VendorUserRolePermissions entity', () => {
			entity = new VendorUserRolePermissions(props, visa);
		});
		When('I access the serviceTicketPermissions property', () => {
			serviceTicketPermissions = entity.serviceTicketPermissions;
		});
		Then(
			'I should receive a VendorUserRoleServiceTicketPermissions entity instance',
			() => {
				expect(serviceTicketPermissions).toBeInstanceOf(
					VendorUserRoleServiceTicketPermissions,
				);
			},
		);
	});

	Scenario('Accessing servicePermissions', ({ Given, When, Then }) => {
		let servicePermissions: VendorUserRoleServicePermissions;
		Given('a VendorUserRolePermissions entity', () => {
			entity = new VendorUserRolePermissions(props, visa);
		});
		When('I access the servicePermissions property', () => {
			servicePermissions = entity.servicePermissions;
		});
		Then(
			'I should receive a VendorUserRoleServicePermissions entity instance',
			() => {
				expect(servicePermissions).toBeInstanceOf(
					VendorUserRoleServicePermissions,
				);
			},
		);
	});

	Scenario('Accessing violationTicketPermissions', ({ Given, When, Then }) => {
		let violationTicketPermissions: VendorUserRoleViolationTicketPermissions;
		Given('a VendorUserRolePermissions entity', () => {
			entity = new VendorUserRolePermissions(props, visa);
		});
		When('I access the violationTicketPermissions property', () => {
			violationTicketPermissions = entity.violationTicketPermissions;
		});
		Then(
			'I should receive a VendorUserRoleViolationTicketPermissions entity instance',
			() => {
				expect(violationTicketPermissions).toBeInstanceOf(
					VendorUserRoleViolationTicketPermissions,
				);
			},
		);
	});
});
