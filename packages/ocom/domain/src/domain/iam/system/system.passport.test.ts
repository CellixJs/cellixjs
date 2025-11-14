import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import type { CommunityPassport } from '../../contexts/community/community.passport.ts';
import type { ServicePassport } from '../../contexts/service/service.passport.ts';
import type { UserPassport } from '../../contexts/user/user.passport.ts';
import { SystemPassport } from './system.passport.ts';
import type { PermissionsSpec } from './system.passport-base.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(__dirname, 'features/system.passport.feature'),
);

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let passport: SystemPassport;
	let permissions: Partial<PermissionsSpec>;
	let communityPassport: CommunityPassport;
	let servicePassport: ServicePassport;
	let userPassport: UserPassport;

	BeforeEachScenario(() => {
		passport = undefined as unknown as SystemPassport;
	});

	Background(({ Given }) => {
		Given('I have a permissions object with canManageMembers true', () => {
			permissions = {
				canManageMembers: true,
			};
		});
	});

	Scenario(
		'Creating SystemPassport and accessing community passport',
		({ Given, When, Then, And }) => {
			Given('I create a SystemPassport with permissions', () => {
				passport = new SystemPassport(permissions);
			});

			When('I access the community property', () => {
				communityPassport = passport.community;
			});

			Then('it should return a SystemCommunityPassport instance', () => {
				expect(communityPassport).toBeDefined();
				expect(communityPassport.constructor.name).toBe(
					'SystemCommunityPassport',
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
		'Creating SystemPassport and accessing service passport',
		({ Given, When, Then, And }) => {
			Given('I create a SystemPassport with permissions', () => {
				passport = new SystemPassport(permissions);
			});

			When('I access the service property', () => {
				servicePassport = passport.service;
			});

			Then('it should return a SystemServicePassport instance', () => {
				expect(servicePassport).toBeDefined();
				expect(servicePassport.constructor.name).toBe('SystemServicePassport');
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
		'Creating SystemPassport and accessing user passport',
		({ Given, When, Then, And }) => {
			Given('I create a SystemPassport with permissions', () => {
				passport = new SystemPassport(permissions);
			});

			When('I access the user property', () => {
				userPassport = passport.user;
			});

			Then('it should return a SystemUserPassport instance', () => {
				expect(userPassport).toBeDefined();
				expect(userPassport.constructor.name).toBe('SystemUserPassport');
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
		'Creating SystemPassport with no permissions',
		({ Given, When, Then }) => {
			Given('I create a SystemPassport with no permissions', () => {
				passport = new SystemPassport();
			});

			When('I access the community, service, and user properties', () => {
				communityPassport = passport.community;
				servicePassport = passport.service;
				userPassport = passport.user;
			});

			Then('all passport instances should be created successfully', () => {
				expect(communityPassport).toBeDefined();
				expect(servicePassport).toBeDefined();
				expect(userPassport).toBeDefined();
			});
		},
	);
});
