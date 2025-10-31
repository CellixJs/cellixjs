import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import type { PropertyEntityReference } from '../../../contexts/property/property/property.aggregate.ts';
import type { PropertyVisa } from '../../../contexts/property/property.visa.ts';
import { GuestPropertyPassport } from './guest.property.passport.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/guest.property.passport.feature'),
);

test.for(feature, ({ Scenario }) => {
  let passport: GuestPropertyPassport;
  let propertyRef: PropertyEntityReference;
  let visa: PropertyVisa;

  Scenario('Creating GuestPropertyPassport and getting visa for property', ({ When, Then, And }) => {
    When('I create a GuestPropertyPassport', () => {
      passport = new GuestPropertyPassport();
    });

    And('I have a property entity reference', () => {
      propertyRef = { id: 'property-123' } as PropertyEntityReference;
    });

    And('I call forProperty with the property reference', () => {
      visa = passport.forProperty(propertyRef);
    });

    Then('it should return a PropertyVisa', () => {
      expect(visa).toBeDefined();
      expect(typeof visa.determineIf).toBe('function');
    });

    And('the visa should deny all permissions', () => {
      expect(visa.determineIf(() => true)).toBe(false);
      expect(visa.determineIf(() => false)).toBe(false);
    });
  });
});