import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import * as ValueObjects from './member.value-objects.ts';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/member.value-objects.feature'),
);

test.for(feature, ({ Scenario }) => {
  // MemberName
  Scenario('Creating a member name with valid value', ({ When, Then }) => {
    let value: string;
    When('I create a member name with "Alice"', () => {
      value = new ValueObjects.MemberName('Alice').valueOf();
    });
    Then('the value should be "Alice"', () => {
      expect(value).toBe('Alice');
    });
  });

  Scenario('Creating a member name with leading and trailing whitespace', ({ When, Then }) => {
    let value: string;
    When('I create a member name with "  Alice  "', () => {
      value = new ValueObjects.MemberName('  Alice  ').valueOf();
    });
    Then('the value should be "Alice"', () => {
      expect(value).toBe('Alice');
    });
  });

  Scenario('Creating a member name with maximum allowed length', ({ When, Then }) => {
    let value: string;
    When('I create a member name with a string of 200 characters', () => {
      value = new ValueObjects.MemberName('a'.repeat(200)).valueOf();
    });
    Then('the value should be the 200 character string', () => {
      expect(value).toBe('a'.repeat(200));
    });
  });

  Scenario('Creating a member name with more than maximum allowed length', ({ When, Then }) => {
    let createMemberNameAboveMaxLength: () => void;
    When('I try to create a member name with a string of 201 characters', () => {
      createMemberNameAboveMaxLength = () => {
        new ValueObjects.MemberName('a'.repeat(201)).valueOf();
      };
    });
    Then('an error should be thrown indicating the member name is too long', () => {
      expect(createMemberNameAboveMaxLength).toThrow('Too long');
    });
  });

  Scenario('Creating a member name with minimum allowed length', ({ When, Then }) => {
    let value: string;
    When('I create a member name with a string of 1 character', () => {
      value = new ValueObjects.MemberName('a').valueOf();
    });
    Then('the value should be the 1 character string', () => {
      expect(value).toBe('a');
    });
  });

  Scenario('Creating a member name with less than minimum allowed length', ({ When, Then }) => {
    let createMemberNameBelowMinLength: () => void;
    When('I try to create a member name with an empty string', () => {
      createMemberNameBelowMinLength = () => {
        new ValueObjects.MemberName('').valueOf();
      };
    });
    Then('an error should be thrown indicating the member name is too short', () => {
      expect(createMemberNameBelowMinLength).toThrow('Too short');
    });
  });

  Scenario('Creating a member name with null', ({ When, Then }) => {
    let createMemberNameNull: () => void;
    When('I try to create a member name with null', () => {
      createMemberNameNull = () => {
        // @ts-expect-error
        new ValueObjects.MemberName(null).valueOf();
      };
    });
    Then('an error should be thrown indicating the member name is invalid', () => {
      expect(createMemberNameNull).toThrow('Wrong raw value type');
    });
  });

  Scenario('Creating a member name with undefined', ({ When, Then }) => {
    let createMemberNameUndefined: () => void;
    When('I try to create a member name with undefined', () => {
      createMemberNameUndefined = () => {
        // @ts-expect-error
        new ValueObjects.MemberName(undefined).valueOf();
      };
    });
    Then('an error should be thrown indicating the member name is invalid', () => {
      expect(createMemberNameUndefined).toThrow('Wrong raw value type');
    });
  });

  // CyberSourceCustomerId
  Scenario('Creating a CyberSourceCustomerId with valid value', ({ When, Then }) => {
    let value: string;
    When('I create a CyberSourceCustomerId with "cs_123"', () => {
      value = new ValueObjects.CyberSourceCustomerId('cs_123').valueOf();
    });
    Then('the value should be "cs_123"', () => {
      expect(value).toBe('cs_123');
    });
  });

  Scenario('Creating a CyberSourceCustomerId with maximum allowed length', ({ When, Then }) => {
    let value: string;
    When('I create a CyberSourceCustomerId with a string of 50 characters', () => {
      value = new ValueObjects.CyberSourceCustomerId('a'.repeat(50)).valueOf();
    });
    Then('the value should be the 50 character string', () => {
      expect(value).toBe('a'.repeat(50));
    });
  });

  Scenario('Creating a CyberSourceCustomerId with more than maximum allowed length', ({ When, Then }) => {
    let createCyberSourceCustomerIdAboveMaxLength: () => void;
    When('I try to create a CyberSourceCustomerId with a string of 51 characters', () => {
      createCyberSourceCustomerIdAboveMaxLength = () => {
        new ValueObjects.CyberSourceCustomerId('a'.repeat(51)).valueOf();
      };
    });
    Then('an error should be thrown indicating the CyberSourceCustomerId is too long', () => {
      expect(createCyberSourceCustomerIdAboveMaxLength).toThrow('Too long');
    });
  });

  Scenario('Creating a CyberSourceCustomerId with minimum allowed length', ({ When, Then }) => {
    let value: string;
    When('I create a CyberSourceCustomerId with a string of 1 character', () => {
      value = new ValueObjects.CyberSourceCustomerId('a').valueOf();
    });
    Then('the value should be the 1 character string', () => {
      expect(value).toBe('a');
    });
  });

  Scenario('Creating a CyberSourceCustomerId with less than minimum allowed length', ({ When, Then }) => {
    let createCyberSourceCustomerIdBelowMinLength: () => void;
    When('I try to create a CyberSourceCustomerId with an empty string', () => {
      createCyberSourceCustomerIdBelowMinLength = () => {
        new ValueObjects.CyberSourceCustomerId('').valueOf();
      };
    });
    Then('an error should be thrown indicating the CyberSourceCustomerId is too short', () => {
      expect(createCyberSourceCustomerIdBelowMinLength).toThrow('Too short');
    });
  });

  Scenario('Creating a CyberSourceCustomerId with null', ({ When, Then }) => {
    let createCyberSourceCustomerIdNull: () => void;
    When('I try to create a CyberSourceCustomerId with null', () => {
      createCyberSourceCustomerIdNull = () => {
        // @ts-expect-error
        new ValueObjects.CyberSourceCustomerId(null).valueOf();
      };
    });
    Then('an error should be thrown indicating the CyberSourceCustomerId is invalid', () => {
      expect(createCyberSourceCustomerIdNull).toThrow('Wrong raw value type');
    });
  });

  Scenario('Creating a CyberSourceCustomerId with undefined', ({ When, Then }) => {
    let createCyberSourceCustomerIdUndefined: () => void;
    When('I try to create a CyberSourceCustomerId with undefined', () => {
      createCyberSourceCustomerIdUndefined = () => {
        // @ts-expect-error
        new ValueObjects.CyberSourceCustomerId(undefined).valueOf();
      };
    });
    Then('an error should be thrown indicating the CyberSourceCustomerId is invalid', () => {
      expect(createCyberSourceCustomerIdUndefined).toThrow('Wrong raw value type');
    });
  });
});