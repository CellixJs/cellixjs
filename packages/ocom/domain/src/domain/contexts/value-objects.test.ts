import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import * as ValueObjects from './value-objects.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'value-objects.feature'),
);

describeFeature(feature, ({ Scenario }) => {
  // Email
  Scenario('Creating an email with a valid value', ({ When, Then }) => {
    let value: string;
    When('I create an email with "alice@example.com"', () => {
      value = new ValueObjects.Email('alice@example.com').valueOf();
    });
    Then('the value should be "alice@example.com"', () => {
      expect(value).toBe('alice@example.com');
    });
  });

  Scenario('Creating an email with leading and trailing whitespace', ({ When, Then }) => {
    let value: string;
    When('I create an email with "  alice@example.com  "', () => {
      value = new ValueObjects.Email('  alice@example.com  ').valueOf();
    });
    Then('the value should be "alice@example.com"', () => {
      expect(value).toBe('alice@example.com');
    });
  });

  Scenario('Creating an email with maximum allowed length', ({ When, Then }) => {
    let value: string;
    When('I create an email with a string of 254 characters ending with "@e.com"', () => {
      value = new ValueObjects.Email(`${'a'.repeat(248)}@e.com`).valueOf();
    });
    Then('the value should be the 254 character string', () => {
      expect(value.length).toBe(254);
      expect(value.endsWith('@e.com')).toBe(true);
    });
  });

  Scenario('Creating an email with more than the maximum allowed length', ({ When, Then }) => {
    let createEmail: () => void;
    When('I try to create an email with a string of 255 characters ending with "@e.com"', () => {
      createEmail = () => {
        new ValueObjects.Email(`${'a'.repeat(249)}@e.com`).valueOf();
      };
    });
    Then('an error should be thrown indicating the value is too long', () => {
      expect(createEmail).toThrow('Too long');
    });
  });

  Scenario('Creating an email with an invalid value', ({ When, Then }) => {
    let createEmail: () => void;
    When('I try to create an email with "not-an-email"', () => {
      createEmail = () => {
        new ValueObjects.Email('not-an-email').valueOf();
      };
    });
    Then('an error should be thrown indicating the value is invalid', () => {
      expect(createEmail).toThrow("Value doesn't match pattern");
    });
  });

  Scenario('Creating an email with an empty string', ({ When, Then }) => {
    let createEmail: () => void;
    When('I try to create an email with an empty string', () => {
      createEmail = () => {
        new ValueObjects.Email('').valueOf();
      };
    });
    Then('an error should be thrown indicating the value is invalid', () => {
      expect(createEmail).toThrow("Value doesn't match pattern");
    });
  });

  Scenario('Creating an email with a null value', ({ When, Then }) => {
    let createEmail: () => void;
    When('I try to create an email with a null value', () => {
      createEmail = () => {
        // @ts-expect-error
        new ValueObjects.Email(null).valueOf();
      };
    });
    Then('an error should be thrown indicating the value is invalid', () => {
      expect(createEmail).toThrow(/Wrong raw value type/i);
    });
  });

  Scenario('Creating an email with an undefined value', ({ When, Then }) => {
    let createEmail: () => void;
    When('I try to create an email with an undefined value', () => {
      createEmail = () => {
        // @ts-expect-error
        new ValueObjects.Email(undefined).valueOf();
      };
    });
    Then('an error should be thrown indicating the value is invalid', () => {
      expect(createEmail).toThrow(/Wrong raw value type/i);
    });
  });

  // NullableEmail
  Scenario('Creating a nullable email with a valid value', ({ When, Then }) => {
    let value: string;
    When('I create a nullable email with "bob@example.com"', () => {
      value = new ValueObjects.NullableEmail('bob@example.com').valueOf();
    });
    Then('the value should be "bob@example.com"', () => {
      expect(value).toBe('bob@example.com');
    });
  });

  Scenario('Creating a nullable email with leading and trailing whitespace', ({ When, Then }) => {
    let value: string;
    When('I create a nullable email with "  alice@example.com  "', () => {
      value = new ValueObjects.NullableEmail('  alice@example.com  ').valueOf();
    });
    Then('the value should be "alice@example.com"', () => {
      expect(value).toBe('alice@example.com');
    });
  });

  Scenario('Creating a nullable email with maximum allowed length', ({ When, Then }) => {
    let value: string;
    When('I create a nullable email with a string of 254 characters ending with "@e.com"', () => {
      value = new ValueObjects.NullableEmail(`${'a'.repeat(248)}@e.com`).valueOf();
    });
    Then('the value should be the 254 character string', () => {
      expect(value.length).toBe(254);
      expect(value.endsWith('@e.com')).toBe(true);
    });
  });

  Scenario('Creating a nullable email with more than the maximum allowed length', ({ When, Then }) => {
    let createNullableEmail: () => void;
    When('I try to create a nullable email with a string of 255 characters ending with "@e.com"', () => {
      createNullableEmail = () => {
        new ValueObjects.NullableEmail(`${'a'.repeat(249)}@e.com`).valueOf();
      };
    });
    Then('an error should be thrown indicating the value is too long', () => {
      expect(createNullableEmail).toThrow('Too long');
    });
  });

  Scenario('Creating a nullable email with an invalid value', ({ When, Then }) => {
    let createNullableEmail: () => void;
    When('I try to create a nullable email with "not-an-email"', () => {
      createNullableEmail = () => {
        new ValueObjects.NullableEmail('not-an-email').valueOf();
      };
    });
    Then('an error should be thrown indicating the value is invalid', () => {
      expect(createNullableEmail).toThrow("Value doesn't match pattern");
    });
  });

  Scenario('Creating a nullable email with an empty string', ({ When, Then }) => {
    let value: string;
    When('I create a nullable email with an empty string', () => {
      value = new ValueObjects.NullableEmail('').valueOf();
    });
    Then('the value should be ""', () => {
      expect(value).toBe('');
    });
  });

  Scenario('Creating a nullable email with a null value', ({ When, Then }) => {
    let createNullableEmail: () => void;
    When('I create a nullable email with a null value', () => {
      createNullableEmail = () => {
        // @ts-expect-error
        new ValueObjects.NullableEmail(null).valueOf();
      };
    });
    Then('an error should be thrown indicating the value is invalid', () => {
      expect(createNullableEmail).toThrow(/Wrong raw value type/i);
    });
  });

  Scenario('Creating a nullable email with an undefined value', ({ When, Then }) => {
    let createNullableEmail: () => void;
    When('I create a nullable email with an undefined value', () => {
      createNullableEmail = () => {
        // @ts-expect-error
        new ValueObjects.NullableEmail(undefined).valueOf();
      };
    });
    Then('an error should be thrown indicating the value is invalid', () => {
      expect(createNullableEmail).toThrow(/Wrong raw value type/i);
    });
  });

  // ExternalId
  Scenario('Creating an ExternalId with a valid GUID', ({ When, Then }) => {
    let value: string;
    When('I create an ExternalId with "123e4567-e89b-12d3-a456-426614174000"', () => {
      value = new ValueObjects.ExternalId('123e4567-e89b-12d3-a456-426614174000').valueOf();
    });
    Then('the value should be "123e4567-e89b-12d3-a456-426614174000"', () => {
      expect(value).toBe('123e4567-e89b-12d3-a456-426614174000');
    });
  });

  Scenario('Creating an ExternalId with leading and trailing whitespace', ({ When, Then }) => {
    let value: string;
    When('I create an ExternalId with "  123e4567-e89b-12d3-a456-426614174000  "', () => {
      value = new ValueObjects.ExternalId('  123e4567-e89b-12d3-a456-426614174000  ').valueOf();
    });
    Then('the value should be "123e4567-e89b-12d3-a456-426614174000"', () => {
      expect(value).toBe('123e4567-e89b-12d3-a456-426614174000');
    });
  });

  Scenario('Creating an ExternalId with an invalid GUID', ({ When, Then }) => {
    let createExternalId: () => void;
    When('I try to create an ExternalId with a valid length string but not a valid GUID', () => {
      createExternalId = () => {
        new ValueObjects.ExternalId('a'.repeat(36)).valueOf();
      };
    });
    Then('an error should be thrown indicating the value is invalid', () => {
      expect(createExternalId).toThrow("Value doesn't match pattern");
    });
  });

  Scenario('Creating an ExternalId with less than 36 characters', ({ When, Then }) => {
    let createExternalId: () => void;
    When('I try to create an ExternalId with "short-id"', () => {
      createExternalId = () => {
        new ValueObjects.ExternalId('short-id').valueOf();
      };
    });
    Then('an error should be thrown indicating the value is too short', () => {
      expect(createExternalId).toThrow('Too short');
    });
  });

  Scenario('Creating an ExternalId with more than 36 characters', ({ When, Then }) => {
    let createExternalId: () => void;
    When('I try to create an ExternalId with a string of 37 characters', () => {
      createExternalId = () => {
        new ValueObjects.ExternalId('a'.repeat(37)).valueOf();
      };
    });
    Then('an error should be thrown indicating the value is too long', () => {
      expect(createExternalId).toThrow('Too long');
    });
  });
});