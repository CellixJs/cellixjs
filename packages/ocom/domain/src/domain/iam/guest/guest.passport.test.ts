import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import type { CasePassport } from '../../contexts/case/case.passport.ts';
import type { CommunityPassport } from '../../contexts/community/community.passport.ts';
import type { PropertyPassport } from '../../contexts/property/property.passport.ts';
import type { ServicePassport } from '../../contexts/service/service.passport.ts';
import type { UserPassport } from '../../contexts/user/user.passport.ts';
import { GuestPassport } from './guest.passport.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(__dirname, 'features/guest.passport.feature'),
);

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
	let passport: GuestPassport;
	let casePassport: CasePassport;
	let communityPassport: CommunityPassport;
	let propertyPassport: PropertyPassport;
	let servicePassport: ServicePassport;
	let userPassport: UserPassport;

	BeforeEachScenario(() => {
		passport = undefined as unknown as GuestPassport;
	});

	Scenario(
		'Creating GuestPassport and accessing community passport',
		({ When, Then, And }) => {
			When('I create a GuestPassport', () => {
				passport = new GuestPassport();
			});

			And('I access the community property', () => {
				communityPassport = passport.community;
			});

			Then('it should return a GuestCommunityPassport instance', () => {
				expect(communityPassport).toBeDefined();
				expect(communityPassport.constructor.name).toBe(
					'GuestCommunityPassport',
				);
			});

			And(
				'accessing community property again should return the same instance',
				() => {
					const secondAccess = passport.community;
					expect(secondAccess).toBe(communityPassport);
				},
			);
		},
	);

	Scenario(
		'Creating GuestPassport and accessing service passport',
		({ When, Then, And }) => {
			When('I create a GuestPassport', () => {
				passport = new GuestPassport();
			});

			And('I access the service property', () => {
				servicePassport = passport.service;
			});

			Then('it should return a GuestServicePassport instance', () => {
				expect(servicePassport).toBeDefined();
				expect(servicePassport.constructor.name).toBe('GuestServicePassport');
			});

			And(
				'accessing service property again should return the same instance',
				() => {
					const secondAccess = passport.service;
					expect(secondAccess).toBe(servicePassport);
				},
			);
		},
	);

	Scenario(
		'Creating GuestPassport and accessing user passport',
		({ When, Then, And }) => {
			When('I create a GuestPassport', () => {
				passport = new GuestPassport();
			});

			And('I access the user property', () => {
				userPassport = passport.user;
			});

			Then('it should return a GuestUserPassport instance', () => {
				expect(userPassport).toBeDefined();
				expect(userPassport.constructor.name).toBe('GuestUserPassport');
			});

			And(
				'accessing user property again should return the same instance',
				() => {
					const secondAccess = passport.user;
					expect(secondAccess).toBe(userPassport);
				},
			);
		},
	);

	Scenario(
		'Creating GuestPassport and accessing property passport',
		({ When, Then, And }) => {
			When('I create a GuestPassport', () => {
				passport = new GuestPassport();
			});

			And('I access the property property', () => {
				propertyPassport = passport.property;
			});

			Then('it should return a GuestPropertyPassport instance', () => {
				expect(propertyPassport).toBeDefined();
				expect(propertyPassport.constructor.name).toBe('GuestPropertyPassport');
			});

			And(
				'accessing property property again should return the same instance',
				() => {
					const secondAccess = passport.property;
					expect(secondAccess).toBe(propertyPassport);
				},
			);
		},
	);

	Scenario(
		'Creating GuestPassport and accessing case passport',
		({ When, Then, And }) => {
			When('I create a GuestPassport', () => {
				passport = new GuestPassport();
			});

			And('I access the case property', () => {
				casePassport = passport.case;
			});

			Then('it should return a GuestCasePassport instance', () => {
				expect(casePassport).toBeDefined();
				expect(casePassport.constructor.name).toBe('GuestCasePassport');
			});

			And(
				'accessing case property again should return the same instance',
				() => {
					const secondAccess = passport.case;
					expect(secondAccess).toBe(casePassport);
				},
			);
		},
	);
});
