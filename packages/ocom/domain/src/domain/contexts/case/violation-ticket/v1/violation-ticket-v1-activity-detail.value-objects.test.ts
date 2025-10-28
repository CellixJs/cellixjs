import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import * as ValueObjects from './violation-ticket-v1-activity-detail.value-objects.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/violation-ticket-v1-activity-detail.value-objects.feature'),
);

test.for(feature, ({ Scenario }) => {
  // Description
  Scenario('Creating a description with valid value', ({ When, Then }) => {
    let value: string;
    When('I create a description with "Valid description"', () => {
      value = new ValueObjects.Description('Valid description').valueOf();
    });
    Then('the value should be "Valid description"', () => {
      expect(value).toBe('Valid description');
    });
  });

  Scenario('Creating a description with leading and trailing whitespace', ({ When, Then }) => {
    let value: string;
    When('I create a description with "  Valid description  "', () => {
      value = new ValueObjects.Description('  Valid description  ').valueOf();
    });
    Then('the value should be "Valid description"', () => {
      expect(value).toBe('Valid description');
    });
  });

  Scenario('Creating a description with maximum allowed length', ({ When, Then }) => {
    let value: string;
    When('I create a description with a string of 2000 characters', () => {
      const longDescription = 'a'.repeat(2000);
      value = new ValueObjects.Description(longDescription).valueOf();
    });
    Then('the value should be the 2000 character string', () => {
      expect(value).toBe('a'.repeat(2000));
    });
  });

  Scenario('Creating a description with more than maximum allowed length', ({ When, Then }) => {
    let createDescriptionAboveMaxLength: () => void;
    When('I try to create a description with a string of 2001 characters', () => {
      createDescriptionAboveMaxLength = () => {
        new ValueObjects.Description('a'.repeat(2001));
      };
    });
    Then('an error should be thrown indicating the description is too long', () => {
      expect(createDescriptionAboveMaxLength).toThrow('Too long');
    });
  });

  Scenario('Creating a description with null', ({ When, Then }) => {
    let createDescriptionWithNull: () => void;
    When('I try to create a description with null', () => {
      createDescriptionWithNull = () => {
        // @ts-expect-error Testing invalid input
        new ValueObjects.Description(null);
      };
    });
    Then('an error should be thrown indicating the description is invalid', () => {
      expect(createDescriptionWithNull).toThrow('Wrong raw value type');
    });
  });

  Scenario('Creating a description with undefined', ({ When, Then }) => {
    let createDescriptionWithUndefined: () => void;
    When('I try to create a description with undefined', () => {
      createDescriptionWithUndefined = () => {
        // @ts-expect-error Testing invalid input
        new ValueObjects.Description(undefined);
      };
    });
    Then('an error should be thrown indicating the description is invalid', () => {
      expect(createDescriptionWithUndefined).toThrow('Wrong raw value type');
    });
  });

  // ActivityTypeCode
  Scenario('Creating an activity type code with valid value', ({ When, Then }) => {
    let value: string;
    When('I create an activity type code with "CREATED"', () => {
      value = new ValueObjects.ActivityTypeCode('CREATED').valueOf();
    });
    Then('the value should be "CREATED"', () => {
      expect(value).toBe('CREATED');
    });
  });

  Scenario('Creating an activity type code with invalid value', ({ When, Then }) => {
    let createActivityTypeCodeWithInvalidValue: () => void;
    When('I try to create an activity type code with "INVALID"', () => {
      createActivityTypeCodeWithInvalidValue = () => {
        new ValueObjects.ActivityTypeCode('INVALID');
      };
    });
    Then('an error should be thrown indicating the activity type code is invalid', () => {
      expect(createActivityTypeCodeWithInvalidValue).toThrow('Value not found in set');
    });
  });

  Scenario('Creating an activity type code with null', ({ When, Then }) => {
    let createActivityTypeCodeWithNull: () => void;
    When('I try to create an activity type code with null', () => {
      createActivityTypeCodeWithNull = () => {
        // @ts-expect-error Testing invalid input
        new ValueObjects.ActivityTypeCode(null);
      };
    });
    Then('an error should be thrown indicating the activity type code is invalid', () => {
      expect(createActivityTypeCodeWithNull).toThrow('Wrong raw value type');
    });
  });

  Scenario('Creating an activity type code with undefined', ({ When, Then }) => {
    let createActivityTypeCodeWithUndefined: () => void;
    When('I try to create an activity type code with undefined', () => {
      createActivityTypeCodeWithUndefined = () => {
        // @ts-expect-error Testing invalid input
        new ValueObjects.ActivityTypeCode(undefined);
      };
    });
    Then('an error should be thrown indicating the activity type code is invalid', () => {
      expect(createActivityTypeCodeWithUndefined).toThrow('Wrong raw value type');
    });
  });
});