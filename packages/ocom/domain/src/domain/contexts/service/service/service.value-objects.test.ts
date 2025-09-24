import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import * as ValueObjects from './service.value-objects.ts';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/service.value-objects.feature'),
);

test.for(feature, ({ Scenario }) => {
  // ServiceName
  Scenario('Creating a service name with valid value', ({ When, Then }) => {
    let value: string;
    When('I create a service name with "Test Service"', () => {
      value = new ValueObjects.ServiceName('Test Service').valueOf();
    });
    Then('the value should be "Test Service"', () => {
      expect(value).toBe('Test Service');
    });
  });

  Scenario('Creating a service name with leading and trailing whitespace', ({ When, Then }) => {
    let value: string;
    When('I create a service name with "  Test Service  "', () => {
      value = new ValueObjects.ServiceName('  Test Service  ').valueOf();
    });
    Then('the value should be "Test Service"', () => {
      expect(value).toBe('Test Service');
    });
  });

  Scenario('Creating a service name with maximum allowed length', ({ When, Then }) => {
    let value: string;
    When('I create a service name with a string of 100 characters', () => {
      value = new ValueObjects.ServiceName('a'.repeat(100)).valueOf();
    });
    Then('the value should be the 100 character string', () => {
      expect(value).toBe('a'.repeat(100));
    });
  });

  Scenario('Creating a service name with more than maximum allowed length', ({ When, Then }) => {
    let createServiceNameAboveMaxLength: () => void;
    When('I try to create a service name with a string of 101 characters', () => {
      createServiceNameAboveMaxLength = () => {
        new ValueObjects.ServiceName('a'.repeat(101)).valueOf();
      };
    });
    Then('an error should be thrown indicating the service name is too long', () => {
      expect(createServiceNameAboveMaxLength).toThrow('Too long');
    });
  });

  Scenario('Creating a service name with minimum allowed length', ({ When, Then }) => {
    let value: string;
    When('I create a service name with a string of 3 characters', () => {
      value = new ValueObjects.ServiceName('abc').valueOf();
    });
    Then('the value should be the 3 character string', () => {
      expect(value).toBe('abc');
    });
  });

  Scenario('Creating a service name with less than minimum allowed length', ({ When, Then }) => {
    let createServiceNameBelowMinLength: () => void;
    When('I try to create a service name with a string of 2 characters', () => {
      createServiceNameBelowMinLength = () => {
        new ValueObjects.ServiceName('ab').valueOf();
      };
    });
    Then('an error should be thrown indicating the service name is too short', () => {
      expect(createServiceNameBelowMinLength).toThrow('Too short');
    });
  });

  Scenario('Creating a service name with null', ({ When, Then }) => {
    let createServiceNameWithNull: () => void;
    When('I try to create a service name with null', () => {
      createServiceNameWithNull = () => {
        // @ts-expect-error
        new ValueObjects.ServiceName(null).valueOf();
      };
    });
    Then('an error should be thrown indicating the service name is invalid', () => {
      expect(createServiceNameWithNull).toThrow(/Wrong raw value type/i);
    });
  });

  Scenario('Creating a service name with undefined', ({ When, Then }) => {
    let createServiceNameWithUndefined: () => void;
    When('I try to create a service name with undefined', () => {
      createServiceNameWithUndefined = () => {
        // @ts-expect-error
        new ValueObjects.ServiceName(undefined).valueOf();
      };
    });
    Then('an error should be thrown indicating the service name is invalid', () => {
      expect(createServiceNameWithUndefined).toThrow(/Wrong raw value type/i);
    });
  });

  // Description
  Scenario('Creating a description with valid value', ({ When, Then }) => {
    let value: string;
    When('I create a description with "A test service description"', () => {
      value = new ValueObjects.Description('A test service description').valueOf();
    });
    Then('the value should be "A test service description"', () => {
      expect(value).toBe('A test service description');
    });
  });

  Scenario('Creating a description with leading and trailing whitespace', ({ When, Then }) => {
    let value: string;
    When('I create a description with "  A test service description  "', () => {
      value = new ValueObjects.Description('  A test service description  ').valueOf();
    });
    Then('the value should be "A test service description"', () => {
      expect(value).toBe('A test service description');
    });
  });

  Scenario('Creating a description with maximum allowed length', ({ When, Then }) => {
    let value: string;
    When('I create a description with a string of 500 characters', () => {
      value = new ValueObjects.Description('a'.repeat(500)).valueOf();
    });
    Then('the value should be the 500 character string', () => {
      expect(value).toBe('a'.repeat(500));
    });
  });

  Scenario('Creating a description with more than maximum allowed length', ({ When, Then }) => {
    let createDescriptionAboveMaxLength: () => void;
    When('I try to create a description with a string of 501 characters', () => {
      createDescriptionAboveMaxLength = () => {
        new ValueObjects.Description('a'.repeat(501)).valueOf();
      };
    });
    Then('an error should be thrown indicating the description is too long', () => {
      expect(createDescriptionAboveMaxLength).toThrow('Too long');
    });
  });

  Scenario('Creating a description with minimum allowed length', ({ When, Then }) => {
    let value: string;
    When('I create a description with a string of 1 character', () => {
      value = new ValueObjects.Description('a').valueOf();
    });
    Then('the value should be the 1 character string', () => {
      expect(value).toBe('a');
    });
  });

  Scenario('Creating a description with less than minimum allowed length', ({ When, Then }) => {
    let createDescriptionBelowMinLength: () => void;
    When('I try to create a description with an empty string', () => {
      createDescriptionBelowMinLength = () => {
        new ValueObjects.Description('').valueOf();
      };
    });
    Then('an error should be thrown indicating the description is too short', () => {
      expect(createDescriptionBelowMinLength).toThrow('Too short');
    });
  });

  Scenario('Creating a description with null', ({ When, Then }) => {
    let createDescriptionWithNull: () => void;
    When('I try to create a description with null', () => {
      createDescriptionWithNull = () => {
        // @ts-expect-error
        new ValueObjects.Description(null).valueOf();
      };
    });
    Then('an error should be thrown indicating the description is invalid', () => {
      expect(createDescriptionWithNull).toThrow(/Wrong raw value type/i);
    });
  });

  Scenario('Creating a description with undefined', ({ When, Then }) => {
    let createDescriptionWithUndefined: () => void;
    When('I try to create a description with undefined', () => {
      createDescriptionWithUndefined = () => {
        // @ts-expect-error
        new ValueObjects.Description(undefined).valueOf();
      };
    });
    Then('an error should be thrown indicating the description is invalid', () => {
      expect(createDescriptionWithUndefined).toThrow(/Wrong raw value type/i);
    });
  });
});