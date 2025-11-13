import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import { EndUserRoleCommunityPermissions } from './end-user-role-community-permissions.ts';
import { EndUserRolePermissions } from './end-user-role-permissions.ts';
import { EndUserRolePropertyPermissions } from './end-user-role-property-permissions.ts';
import { EndUserRoleServicePermissions } from './end-user-role-service-permissions.ts';
import { EndUserRoleServiceTicketPermissions } from './end-user-role-service-ticket-permissions.ts';
import { EndUserRoleViolationTicketPermissions } from './end-user-role-violation-ticket-permissions.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(__dirname, 'features/end-user-role-permissions.feature'),
);

function makeVisa() {
	return vi.mocked({
		determineIf: vi.fn(() => true),
	});
}

function makeProps() {
	return {
		communityPermissions: {} as EndUserRoleCommunityPermissions,
		propertyPermissions: {} as EndUserRolePropertyPermissions,
		serviceTicketPermissions: {} as EndUserRoleServiceTicketPermissions,
		servicePermissions: {} as EndUserRoleServicePermissions,
		violationTicketPermissions: {} as EndUserRoleViolationTicketPermissions,
	};
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let visa: ReturnType<typeof makeVisa>;
	let props: ReturnType<typeof makeProps>;
	let entity: EndUserRolePermissions;

	BeforeEachScenario(() => {
		visa = makeVisa();
		props = makeProps();
		entity = new EndUserRolePermissions(props, visa);
	});

	Background(({ Given, And }) => {
		Given(
			'valid EndUserRolePermissionsProps with all required permission props',
			() => {
				props = makeProps();
			},
		);
		And('a valid UserVisa', () => {
			visa = makeVisa();
		});
	});

	Scenario('Accessing communityPermissions', ({ Given, When, Then }) => {
		let communityPermissions: EndUserRoleCommunityPermissions;
		Given('a EndUserRolePermissions entity', () => {
			entity = new EndUserRolePermissions(props, visa);
		});
		When('I access the communityPermissions property', () => {
			communityPermissions = entity.communityPermissions;
		});
		Then(
			'I should receive a EndUserRoleCommunityPermissions entity instance',
			() => {
				expect(communityPermissions).toBeInstanceOf(
					EndUserRoleCommunityPermissions,
				);
			},
		);
	});

	Scenario('Accessing propertyPermissions', ({ Given, When, Then }) => {
		let propertyPermissions: EndUserRolePropertyPermissions;
		Given('a EndUserRolePermissions entity', () => {
			entity = new EndUserRolePermissions(props, visa);
		});
		When('I access the propertyPermissions property', () => {
			propertyPermissions = entity.propertyPermissions;
		});
		Then(
			'I should receive a EndUserRolePropertyPermissions entity instance',
			() => {
				expect(propertyPermissions).toBeInstanceOf(
					EndUserRolePropertyPermissions,
				);
			},
		);
	});

	Scenario('Accessing serviceTicketPermissions', ({ Given, When, Then }) => {
		let serviceTicketPermissions: EndUserRoleServiceTicketPermissions;
		Given('a EndUserRolePermissions entity', () => {
			entity = new EndUserRolePermissions(props, visa);
		});
		When('I access the serviceTicketPermissions property', () => {
			serviceTicketPermissions = entity.serviceTicketPermissions;
		});
		Then(
			'I should receive a EndUserRoleServiceTicketPermissions entity instance',
			() => {
				expect(serviceTicketPermissions).toBeInstanceOf(
					EndUserRoleServiceTicketPermissions,
				);
			},
		);
	});

	Scenario('Accessing servicePermissions', ({ Given, When, Then }) => {
		let servicePermissions: EndUserRoleServicePermissions;
		Given('a EndUserRolePermissions entity', () => {
			entity = new EndUserRolePermissions(props, visa);
		});
		When('I access the servicePermissions property', () => {
			servicePermissions = entity.servicePermissions;
		});
		Then(
			'I should receive a EndUserRoleServicePermissions entity instance',
			() => {
				expect(servicePermissions).toBeInstanceOf(
					EndUserRoleServicePermissions,
				);
			},
		);
	});

	Scenario('Accessing violationTicketPermissions', ({ Given, When, Then }) => {
		let violationTicketPermissions: EndUserRoleViolationTicketPermissions;
		Given('a EndUserRolePermissions entity', () => {
			entity = new EndUserRolePermissions(props, visa);
		});
		When('I access the violationTicketPermissions property', () => {
			violationTicketPermissions = entity.violationTicketPermissions;
		});
		Then(
			'I should receive a EndUserRoleViolationTicketPermissions entity instance',
			() => {
				expect(violationTicketPermissions).toBeInstanceOf(
					EndUserRoleViolationTicketPermissions,
				);
			},
		);
	});
});
