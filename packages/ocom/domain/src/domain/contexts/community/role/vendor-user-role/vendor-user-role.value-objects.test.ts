import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { RoleName } from './vendor-user-role.value-objects.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/vendor-user-role.value-objects.feature'),
);

describeFeature(feature, ({ Scenario }) => {
  Scenario('Creating a role name with valid value', ({ When, Then }) => {
    let value: string;
    When('I create a role name with "Support"', () => {
      value = new RoleName('Support').valueOf();
    });
    Then('the value should be "Support"', () => {
      expect(value).toBe('Support');
    });
  });

  Scenario('Creating a role name with leading and trailing whitespace', ({ When, Then }) => {
    let value: string;
    When('I create a role name with "  Support  "', () => {
      value = new RoleName('  Support  ').valueOf();
    });
    Then('the value should be "Support"', () => {
      expect(value).toBe('Support');
    });
  });

  Scenario('Creating a role name with maximum allowed length', ({ When, Then }) => {
    let value: string;
    When('I create a role name with a string of 50 characters', () => {
      value = new RoleName('a'.repeat(50)).valueOf();
    });
    Then('the value should be the 50 character string', () => {
      expect(value).toBe('a'.repeat(50));
    });
  });

  Scenario('Creating a role name with more than maximum allowed length', ({ When, Then }) => {
    let createRoleNameAboveMaxLength: () => void;
    When('I try to create a role name with a string of 51 characters', () => {
      createRoleNameAboveMaxLength = () => {
        new RoleName('a'.repeat(51)).valueOf();
      };
    });
    Then('an error should be thrown indicating the role name is too long', () => {
      expect(createRoleNameAboveMaxLength).toThrow('Too long');
    });
  });

  Scenario('Creating a role name with minimum allowed length', ({ When, Then }) => {
    let value: string;
    When('I create a role name with a string of 1 character', () => {
      value = new RoleName('a').valueOf();
    });
    Then('the value should be the 1 character string', () => {
      expect(value).toBe('a');
    });
  });

  Scenario('Creating a role name with less than minimum allowed length', ({ When, Then }) => {
    let createRoleNameBelowMinLength: () => void;
    When('I try to create a role name with an empty string', () => {
      createRoleNameBelowMinLength = () => {
        new RoleName('').valueOf();
      };
    });
    Then('an error should be thrown indicating the role name is too short', () => {
      expect(createRoleNameBelowMinLength).toThrow('Too short');
    });
  });

  Scenario('Creating a role name with null', ({ When, Then }) => {
    let createRoleNameNull: () => void;
    When('I try to create a role name with null', () => {
      createRoleNameNull = () => {
        // @ts-expect-error
        new RoleName(null).valueOf();
      };
    });
    Then('an error should be thrown indicating the wrong type was used', () => {
      expect(createRoleNameNull).toThrow('Wrong raw value type');
    });
  });

  Scenario('Creating a role name with undefined', ({ When, Then }) => {
    let createRoleNameUndefined: () => void;
    When('I try to create a role name with undefined', () => {
      createRoleNameUndefined = () => {
        // @ts-expect-error
        new RoleName(undefined).valueOf();
      };
    });
    Then('an error should be thrown indicating the wrong type was used', () => {
      expect(createRoleNameUndefined).toThrow('Wrong raw value type');
    });
  });
});