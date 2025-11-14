import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import type { CommunityEntityReference } from '../../../contexts/community/community/community.ts';
import type { StaffUserEntityReference } from '../../../contexts/user/staff-user/staff-user.ts';
import { StaffUserCommunityPassport } from './contexts/staff-user.community.passport.ts';
import { StaffUserCommunityVisa } from './contexts/staff-user.community.visa.ts';
import { StaffUserPassport } from './staff-user.passport.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(__dirname, 'features/staff-user.passport.feature'),
);

function makeStaffUser(id = 'staff-1') {
	return {
		id,
		role: {
			permissions: {
				communityPermissions: {
					canManageAllCommunities: true,
					canManageCommunitySettings: true,
				},
			},
		},
	} as unknown as StaffUserEntityReference;
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let staffUser: ReturnType<typeof makeStaffUser>;
	let passport: StaffUserPassport;
	let communityPassport: unknown;

	BeforeEachScenario(() => {
		staffUser = makeStaffUser();
		passport = undefined as unknown as StaffUserPassport;
		communityPassport = undefined as unknown as StaffUserCommunityPassport;
	});

	Background(({ Given }) => {
		Given('a valid StaffUserEntityReference', () => {
			staffUser = makeStaffUser('staff-1');
		});
	});

	Scenario(
		'Creating a StaffUserPassport with valid staff user',
		({ When, Then }) => {
			When('I create a StaffUserPassport with the staff user', () => {
				passport = new StaffUserPassport(staffUser);
			});
			Then('the passport should be created successfully', () => {
				expect(passport).toBeInstanceOf(StaffUserPassport);
			});
		},
	);

	Scenario('Accessing the community passport', ({ When, And, Then }) => {
		// Uncomment and update when StaffUserPassport is implemented
		When('I create a StaffUserPassport with valid staff user', () => {
			passport = new StaffUserPassport(staffUser);
		});
		And('I access the community property', () => {
			communityPassport = passport.community;
		});
		Then(
			'I should receive a StaffUserCommunityPassport instance with all visas',
			() => {
				expect(communityPassport).toBeInstanceOf(StaffUserCommunityPassport);
				expect(
					(communityPassport as StaffUserCommunityPassport).forCommunity({
						id: 'community-1',
					} as CommunityEntityReference),
				).toBeInstanceOf(StaffUserCommunityVisa);
				// Add more assertions for visas if needed
			},
		);
	});

	Scenario('Accessing the service passport', ({ When, And, Then }) => {
		let getServicePassport: () => void;
		When('I create a StaffUserPassport with valid staff user', () => {
			passport = new StaffUserPassport(staffUser);
		});
		And('I access the service property', () => {
			getServicePassport = () => passport.service;
		});
		Then(
			'an error should be thrown indicating the service passport is not available',
			() => {
				expect(getServicePassport).toThrow(
					'Service passport is not available for StaffUserPassport',
				);
			},
		);
	});

	Scenario('Accessing the user passport', ({ When, And, Then }) => {
		let getUserPassport: () => void;
		When('I create a StaffUserPassport with valid staff user', () => {
			passport = new StaffUserPassport(staffUser);
		});
		And('I access the user property', () => {
			getUserPassport = () => passport.user;
		});
		Then(
			'an error should be thrown indicating the user passport is not available',
			() => {
				expect(getUserPassport).toThrow(
					'User passport is not available for StaffUserPassport',
				);
			},
		);
	});
});
