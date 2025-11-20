import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import type { ServiceEntityReference } from '../../../contexts/service/service-aggregate.ts';
import type { ServiceDomainPermissions } from '../../../contexts/service/service.domain-permissions.ts';
import type { ServiceVisa } from '../../../contexts/service/service.visa.ts';
import { SystemServicePassport } from './system.service.passport.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(__dirname, 'features/system.service.passport.feature'),
);

test.for(feature, ({ Scenario, Background }) => {
	let passport: SystemServicePassport;
	let permissions: Partial<ServiceDomainPermissions>;
	let serviceRef: ServiceEntityReference;
	let visa: ServiceVisa;
	let permissionResult: boolean;

	Background(({ Given }) => {
		Given(
			'I have service domain permissions with canManageServices true',
			() => {
				permissions = {
					canManageServices: true,
				};
			},
		);
	});

	Scenario(
		'Creating SystemServicePassport and getting visa for service',
		({ Given, When, Then, And }) => {
			Given('I create a SystemServicePassport with permissions', () => {
				passport = new SystemServicePassport(permissions);
			});

			And('I have a service entity reference', () => {
				serviceRef = { id: 'service-123' } as ServiceEntityReference;
			});

			When('I call forService with the service reference', () => {
				visa = passport.forService(serviceRef);
			});

			Then('it should return a ServiceVisa', () => {
				expect(visa).toBeDefined();
				expect(typeof visa.determineIf).toBe('function');
			});

			And('the visa should allow determining permissions', () => {
				expect(typeof visa.determineIf).toBe('function');
				const result = visa.determineIf(
					(perms: Readonly<ServiceDomainPermissions>) =>
						perms.canManageServices,
				);
				expect(typeof result).toBe('boolean');
			});
		},
	);

	Scenario(
		'Creating SystemServicePassport with no permissions',
		({ Given, When, Then, And }) => {
			Given('I create a SystemServicePassport with no permissions', () => {
				passport = new SystemServicePassport();
			});

			And('I have a service entity reference', () => {
				serviceRef = { id: 'service-123' } as ServiceEntityReference;
			});

			When('I call forService with the service reference', () => {
				visa = passport.forService(serviceRef);
			});

			Then(
				'it should return a ServiceVisa that works with empty permissions',
				() => {
					expect(visa).toBeDefined();
					expect(typeof visa.determineIf).toBe('function');
				},
			);
		},
	);

	Scenario(
		'Using visa to determine permissions',
		({ Given, When, Then, And }) => {
			Given(
				'I create a SystemServicePassport with canManageServices permission',
				() => {
					passport = new SystemServicePassport({ canManageServices: true });
				},
			);

			And('I have a service entity reference', () => {
				serviceRef = { id: 'service-123' } as ServiceEntityReference;
			});

			When('I get a visa for the service', () => {
				visa = passport.forService(serviceRef);
			});

			And('I use determineIf to check if canManageServices is true', () => {
				permissionResult = visa.determineIf(
					(perms: Readonly<ServiceDomainPermissions>) =>
						perms.canManageServices === true,
				);
			});

			Then('it should return true', () => {
				expect(permissionResult).toBe(true);
			});
		},
	);
});
