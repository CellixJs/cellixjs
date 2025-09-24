import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { GuestServicePassport } from './guest.service.passport.ts';
import type { ServiceEntityReference } from '../../../contexts/service/service/service.ts';
import type { ServiceVisa } from '../../../contexts/service/service.visa.ts';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/guest.service.passport.feature'),
);

test.for(feature, ({ Scenario }) => {
  let passport: GuestServicePassport;
  let serviceRef: ServiceEntityReference;
  let visa: ServiceVisa;
  let permissionResult: boolean;

  Scenario('Creating GuestServicePassport and getting visa for service', ({ When, Then, And }) => {
    When('I create a GuestServicePassport', () => {
      passport = new GuestServicePassport();
    });

    And('I have a service entity reference', () => {
      serviceRef = { id: 'service-123' } as ServiceEntityReference;
    });

    And('I call forService with the service reference', () => {
      visa = passport.forService(serviceRef);
    });

    Then('it should return a ServiceVisa', () => {
      expect(visa).toBeDefined();
      expect(typeof visa.determineIf).toBe('function');
    });

    And('the visa should deny all permissions', () => {
      expect(visa.determineIf(() => true)).toBe(false);
    });
  });

  Scenario('Using visa to determine permissions', ({ When, Then, And }) => {
    When('I create a GuestServicePassport', () => {
      passport = new GuestServicePassport();
    });

    And('I have a service entity reference', () => {
      serviceRef = { id: 'service-123' } as ServiceEntityReference;
    });

    And('I get a visa for the service', () => {
      visa = passport.forService(serviceRef);
    });

    And('I use determineIf to check any permission', () => {
      permissionResult = visa.determineIf(() => true);
    });

    Then('it should return false', () => {
      expect(permissionResult).toBe(false);
    });
  });
});