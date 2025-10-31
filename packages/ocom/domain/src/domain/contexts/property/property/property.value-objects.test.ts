import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import * as ValueObjects from './property.value-objects.ts';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/property.value-objects.feature'),
);

test.for(feature, ({ Scenario }) => {
  // PropertyName
  Scenario('Creating a property name with valid value', ({ When, Then }) => {
    let value: string;
    When('I create a property name with "Test Property"', () => {
      value = new ValueObjects.PropertyName('Test Property').valueOf();
    });
    Then('the value should be "Test Property"', () => {
      expect(value).toBe('Test Property');
    });
  });

  Scenario('Creating a property name with leading and trailing whitespace', ({ When, Then }) => {
    let value: string;
    When('I create a property name with "  Test Property  "', () => {
      value = new ValueObjects.PropertyName('  Test Property  ').valueOf();
    });
    Then('the value should be "Test Property"', () => {
      expect(value).toBe('Test Property');
    });
  });

  Scenario('Creating a property name with maximum allowed length', ({ When, Then }) => {
    let value: string;
    When('I create a property name with a string of 100 characters', () => {
      value = new ValueObjects.PropertyName('a'.repeat(100)).valueOf();
    });
    Then('the value should be the 100 character string', () => {
      expect(value).toBe('a'.repeat(100));
    });
  });

  Scenario('Creating a property name with more than maximum allowed length', ({ When, Then }) => {
    let createPropertyNameAboveMaxLength: () => void;
    When('I try to create a property name with a string of 101 characters', () => {
      createPropertyNameAboveMaxLength = () => {
        new ValueObjects.PropertyName('a'.repeat(101)).valueOf();
      };
    });
    Then('an error should be thrown indicating the property name is too long', () => {
      expect(createPropertyNameAboveMaxLength).toThrow('Too long');
    });
  });

  Scenario('Creating a property name with minimum allowed length', ({ When, Then }) => {
    let value: string;
    When('I create a property name with a string of 1 character', () => {
      value = new ValueObjects.PropertyName('a').valueOf();
    });
    Then('the value should be the 1 character string', () => {
      expect(value).toBe('a');
    });
  });

  Scenario('Creating a property name with less than minimum allowed length', ({ When, Then }) => {
    let createPropertyNameBelowMinLength: () => void;
    When('I try to create a property name with an empty string', () => {
      createPropertyNameBelowMinLength = () => {
        new ValueObjects.PropertyName('').valueOf();
      };
    });
    Then('an error should be thrown indicating the property name is too short', () => {
      expect(createPropertyNameBelowMinLength).toThrow('Too short');
    });
  });

  Scenario('Creating a property name with null', ({ When, Then }) => {
    let createPropertyNameWithNull: () => void;
    When('I try to create a property name with null', () => {
      createPropertyNameWithNull = () => {
        // @ts-expect-error
        new ValueObjects.PropertyName(null).valueOf();
      };
    });
    Then('an error should be thrown indicating the property name is invalid', () => {
      expect(createPropertyNameWithNull).toThrow(/Wrong raw value type/i);
    });
  });

  Scenario('Creating a property name with undefined', ({ When, Then }) => {
    let createPropertyNameWithUndefined: () => void;
    When('I try to create a property name with undefined', () => {
      createPropertyNameWithUndefined = () => {
        // @ts-expect-error
        new ValueObjects.PropertyName(undefined).valueOf();
      };
    });
    Then('an error should be thrown indicating the property name is invalid', () => {
      expect(createPropertyNameWithUndefined).toThrow(/Wrong raw value type/i);
    });
  });

  // PropertyType
  Scenario('Creating a property type with valid value', ({ When, Then }) => {
    let value: string;
    When('I create a property type with "House"', () => {
      value = new ValueObjects.PropertyType('House').valueOf();
    });
    Then('the value should be "House"', () => {
      expect(value).toBe('House');
    });
  });

  Scenario('Creating a property type with leading and trailing whitespace', ({ When, Then }) => {
    let value: string;
    When('I create a property type with "  Apartment  "', () => {
      value = new ValueObjects.PropertyType('  Apartment  ').valueOf();
    });
    Then('the value should be "Apartment"', () => {
      expect(value).toBe('Apartment');
    });
  });

  Scenario('Creating a property type with maximum allowed length', ({ When, Then }) => {
    let value: string;
    When('I create a property type with a string of 100 characters', () => {
      value = new ValueObjects.PropertyType('a'.repeat(100)).valueOf();
    });
    Then('the value should be the 100 character string', () => {
      expect(value).toBe('a'.repeat(100));
    });
  });

  Scenario('Creating a property type with more than maximum allowed length', ({ When, Then }) => {
    let createPropertyTypeAboveMaxLength: () => void;
    When('I try to create a property type with a string of 101 characters', () => {
      createPropertyTypeAboveMaxLength = () => {
        new ValueObjects.PropertyType('a'.repeat(101)).valueOf();
      };
    });
    Then('an error should be thrown indicating the property type is too long', () => {
      expect(createPropertyTypeAboveMaxLength).toThrow('Too long');
    });
  });

  Scenario('Creating a property type with minimum allowed length', ({ When, Then }) => {
    let value: string;
    When('I create a property type with a string of 1 character', () => {
      value = new ValueObjects.PropertyType('a').valueOf();
    });
    Then('the value should be the 1 character string', () => {
      expect(value).toBe('a');
    });
  });

  Scenario('Creating a property type with less than minimum allowed length', ({ When, Then }) => {
    let createPropertyTypeBelowMinLength: () => void;
    When('I try to create a property type with an empty string', () => {
      createPropertyTypeBelowMinLength = () => {
        new ValueObjects.PropertyType('').valueOf();
      };
    });
    Then('an error should be thrown indicating the property type is too short', () => {
      expect(createPropertyTypeBelowMinLength).toThrow('Too short');
    });
  });

  Scenario('Creating a property type with null', ({ When, Then }) => {
    let createPropertyTypeWithNull: () => void;
    When('I try to create a property type with null', () => {
      createPropertyTypeWithNull = () => {
        // @ts-expect-error
        new ValueObjects.PropertyType(null).valueOf();
      };
    });
    Then('an error should be thrown indicating the property type is invalid', () => {
      expect(createPropertyTypeWithNull).toThrow(/Wrong raw value type/i);
    });
  });

  Scenario('Creating a property type with undefined', ({ When, Then }) => {
    let createPropertyTypeWithUndefined: () => void;
    When('I try to create a property type with undefined', () => {
      createPropertyTypeWithUndefined = () => {
        // @ts-expect-error
        new ValueObjects.PropertyType(undefined).valueOf();
      };
    });
    Then('an error should be thrown indicating the property type is invalid', () => {
      expect(createPropertyTypeWithUndefined).toThrow(/Wrong raw value type/i);
    });
  });
});