import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import type { PropertyEntityReference } from '../../../contexts/property/property/property.aggregate.ts';
import type { PropertyDomainPermissions } from '../../../contexts/property/property.domain-permissions.ts';
import type { PropertyVisa } from '../../../contexts/property/property.visa.ts';
import { SystemPropertyPassport } from './system.property.passport.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(__dirname, 'features/system.property.passport.feature'),
);

test.for(feature, ({ Scenario, Background }) => {
	let passport: SystemPropertyPassport;
	let permissions: Partial<PropertyDomainPermissions>;
	let propertyRef: PropertyEntityReference;
	let visa: PropertyVisa;
	let permissionResult: boolean;

	Background(({ Given }) => {
		Given(
			'I have property domain permissions with canManageProperties true',
			() => {
				permissions = {
					canManageProperties: true,
				};
			},
		);
	});

	Scenario(
		'Creating SystemPropertyPassport and getting visa for property',
		({ Given, When, Then, And }) => {
			Given('I create a SystemPropertyPassport with permissions', () => {
				passport = new SystemPropertyPassport(permissions);
			});

			And('I have a property entity reference', () => {
				// biome-ignore lint/plugin/no-type-assertion: test file
				propertyRef = { id: 'property-123' } as PropertyEntityReference;
			});

			When('I call forProperty with the property reference', () => {
				visa = passport.forProperty(propertyRef);
			});

			Then('it should return a PropertyVisa', () => {
				expect(visa).toBeDefined();
				expect(typeof visa.determineIf).toBe('function');
			});

			And('the visa should allow determining permissions', () => {
				expect(typeof visa.determineIf).toBe('function');
				const result = visa.determineIf(
					(perms: Readonly<PropertyDomainPermissions>) =>
						perms.canManageProperties,
				);
				expect(typeof result).toBe('boolean');
			});
		},
	);

	Scenario(
		'Creating SystemPropertyPassport with no permissions',
		({ Given, When, Then, And }) => {
			Given('I create a SystemPropertyPassport with no permissions', () => {
				passport = new SystemPropertyPassport();
			});

			And('I have a property entity reference', () => {
				// biome-ignore lint/plugin/no-type-assertion: test file
				propertyRef = { id: 'property-123' } as PropertyEntityReference;
			});

			When('I call forProperty with the property reference', () => {
				visa = passport.forProperty(propertyRef);
			});

			Then(
				'it should return a PropertyVisa that works with empty permissions',
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
				'I create a SystemPropertyPassport with canManageProperties permission',
				() => {
					passport = new SystemPropertyPassport({ canManageProperties: true });
				},
			);

			And('I have a property entity reference', () => {
				// biome-ignore lint/plugin/no-type-assertion: test file
				propertyRef = { id: 'property-123' } as PropertyEntityReference;
			});

			When('I get a visa for the property', () => {
				visa = passport.forProperty(propertyRef);
			});

			And('I use determineIf to check if canManageProperties is true', () => {
				permissionResult = visa.determineIf(
					(perms: Readonly<PropertyDomainPermissions>) =>
						perms.canManageProperties === true,
				);
			});

			Then('it should return true', () => {
				expect(permissionResult).toBe(true);
			});
		},
	);
});
