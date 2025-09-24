import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import * as ValueObjects from './member-profile.value-objects.ts';
import type { VOError } from '@lucaspaganini/value-objects';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/member-profile.value-objects.feature'),
);

test.for(feature, ({ Scenario }) => {
  // Name
  Scenario('Creating a name with valid value', ({ When, Then }) => {
    let value: string;
    When('I create a name with "Alice"', () => {
      value = new ValueObjects.Name('Alice').valueOf();
    });
    Then('the value should be "Alice"', () => {
      expect(value).toBe('Alice');
    });
  });

  Scenario('Creating a name with leading and trailing whitespace', ({ When, Then }) => {
    let value: string;
    When('I create a name with "  Alice  "', () => {
      value = new ValueObjects.Name('  Alice  ').valueOf();
    });
    Then('the value should be "Alice"', () => {
      expect(value).toBe('Alice');
    });
  });

  Scenario('Creating a name with maximum allowed length', ({ When, Then }) => {
    let value: string;
    When('I create a name with a string of 500 characters', () => {
      value = new ValueObjects.Name('a'.repeat(500)).valueOf();
    });
    Then('the value should be the 500 character string', () => {
      expect(value).toBe('a'.repeat(500));
    });
  });

  Scenario('Creating a name with more than maximum allowed length', ({ When, Then }) => {
    let createNameAboveMaxLength: () => void;
    When('I try to create a name with a string of 501 characters', () => {
      createNameAboveMaxLength = () => {
        new ValueObjects.Name('a'.repeat(501)).valueOf();
      };
    });
    Then('an error should be thrown indicating the name is too long', () => {
      expect(createNameAboveMaxLength).toThrow('Too long');
    });
  });

  Scenario('Creating a name with less than minimum allowed length', ({ When, Then }) => {
    let createNameBelowMinLength: () => void;
    When('I try to create a name with an empty string', () => {
      createNameBelowMinLength = () => {
        new ValueObjects.Name('').valueOf();
      };
    });
    Then('an error should be thrown indicating the name is too short', () => {
      expect(createNameBelowMinLength).toThrow('Too short');
    });
  });

  Scenario('Creating a name with null', ({ When, Then }) => {
    let createNameWithNull: () => void;
    When('I try to create a name with null', () => {
      createNameWithNull = () => {
        // @ts-expect-error
        new ValueObjects.Name(null).valueOf();
      };
    });
    Then('an error should be thrown indicating the name is invalid', () => {
      expect(createNameWithNull).toThrow(/Wrong raw value type/i);
    });
  });

  Scenario('Creating a name with undefined', ({ When, Then }) => {
    let createNameWithUndefined: () => void;
    When('I try to create a name with undefined', () => {
      createNameWithUndefined = () => {
        // @ts-expect-error
        new ValueObjects.Name(undefined).valueOf();
      };
    });
    Then('an error should be thrown indicating the name is invalid', () => {
      expect(createNameWithUndefined).toThrow(/Wrong raw value type/i);
    });
  });

  // Bio
  Scenario('Creating a bio with valid value', ({ When, Then }) => {
    let value: string;
    When('I create a bio with "Hello, this is my bio."', () => {
      value = new ValueObjects.Bio('Hello, this is my bio.').valueOf();
    });
    Then('the value should be "Hello, this is my bio."', () => {
      expect(value).toBe('Hello, this is my bio.');
    });
  });

  Scenario('Creating a bio with leading and trailing whitespace', ({ When, Then }) => {
    let value: string;
    When('I create a bio with "  Hello, this is my bio.  "', () => {
      value = new ValueObjects.Bio('  Hello, this is my bio.  ').valueOf();
    });
    Then('the value should be "Hello, this is my bio."', () => {
      expect(value).toBe('Hello, this is my bio.');
    });
  });

  Scenario('Creating a bio with maximum allowed length', ({ When, Then }) => {
    let value: string;
    When('I create a bio with a string of 2000 characters', () => {
      value = new ValueObjects.Bio('a'.repeat(2000)).valueOf();
    });
    Then('the value should be the 2000 character string', () => {
      expect(value).toBe('a'.repeat(2000));
    });
  });

  Scenario('Creating a bio with more than maximum allowed length', ({ When, Then }) => {
    let createBioAboveMaxLength: () => void;
    When('I try to create a bio with a string of 2001 characters', () => {
      createBioAboveMaxLength = () => {
        new ValueObjects.Bio('a'.repeat(2001)).valueOf();
      };
    });
    Then('an error should be thrown indicating the bio is too long', () => {
      expect(createBioAboveMaxLength).toThrow('Too long');
    });
  });

  Scenario('Creating a bio with less than minimum allowed length', ({ When, Then }) => {
    let value: string;
    When('I try to create a bio with an empty string', () => {
      value = new ValueObjects.Bio('').valueOf();
    });
    Then('the value should be ""', () => {
      expect(value).toBe('');
    });
  });

  Scenario('Creating a bio with null', ({ When, Then }) => {
    let createBioWithNull: () => void;
    When('I try to create a bio with null', () => {
      createBioWithNull = () => {
        // @ts-expect-error
        new ValueObjects.Bio(null).valueOf();
      };
    });
    Then('an error should be thrown indicating the bio is invalid', () => {
      expect(createBioWithNull).toThrow(/Wrong raw value type/i);
    });
  });

  Scenario('Creating a bio with undefined', ({ When, Then }) => {
    let createBioWithUndefined: () => void;
    When('I try to create a bio with undefined', () => {
      createBioWithUndefined = () => {
        // @ts-expect-error
        new ValueObjects.Bio(undefined).valueOf();
      };
    });
    Then('an error should be thrown indicating the bio is invalid', () => {
      expect(createBioWithUndefined).toThrow(/Wrong raw value type/i);
    });
  });

  // Interests
  Scenario('Creating interests with valid values', ({ When, Then }) => {
    let value: string[];
    When('I create interests with ["reading", "sports"]', () => {
      value = new ValueObjects.Interests(['reading', 'sports']).valueOf();
    });
    Then('the value should be ["reading", "sports"]', () => {
      expect(value).toEqual(['reading', 'sports']);
    });
  });

  Scenario('Creating interests with a single valid value', ({ When, Then }) => {
    let value: string[];
    When('I create interests with ["reading"]', () => {
      value = new ValueObjects.Interests(['reading']).valueOf();
    });
    Then('the value should be ["reading"]', () => {
      expect(value).toEqual(['reading']);
    });
  });

  Scenario('Creating interests with maximum allowed items', ({ When, Then }) => {
    let value: string[];
    When('I create interests with an array of 20 valid strings', () => {
      value = new ValueObjects.Interests(Array(20).fill('interest')).valueOf();
    });
    Then('the value should be the 20 string array', () => {
      expect(value).toEqual(Array(20).fill('interest'));
    });
  });

  Scenario('Creating interests with more than maximum allowed items', ({ When, Then }) => {
    let createInterestsAboveMax: () => void;
    When('I try to create interests with an array of 21 valid strings', () => {
      createInterestsAboveMax = () => {
        new ValueObjects.Interests(Array(21).fill('interest')).valueOf();
      };
    });
    Then('an error should be thrown indicating the interests are too long', () => {
      expect(createInterestsAboveMax).toThrow('Too long');
    });
  });

  Scenario('Creating interests with an item that is too long', ({ When, Then }) => {
    let createInterestsItemTooLong: () => void;
    When('I try to create interests with ["a".repeat(41)]', () => {
      createInterestsItemTooLong = () => {
        new ValueObjects.Interests(['a'.repeat(41)]).valueOf();
      };
    });
    Then('an error should be thrown indicating the interest is too long', () => {
      try {
        createInterestsItemTooLong();
      } catch (e) {
        // The value-objects library throws an array of error objects for VOArray element errors
        // Use the exported VOError type for type safety
        if (Array.isArray(e) && e.length > 0 && (e[0] as VOError).message === 'Too long') {
          return;
        }
        throw e;
      }
      throw new Error('Expected error was not thrown');
    });
  });

  Scenario('Creating interests with an empty array', ({ When, Then }) => {
    let value: string[];
    When('I create interests with an empty array', () => {
      value = new ValueObjects.Interests([]).valueOf();
    });
    Then('the value should be []', () => {
      expect(value).toEqual([]);
    });
  });

  Scenario('Creating interests with null', ({ When, Then }) => {
    let createInterestsWithNull: () => void;
    When('I try to create interests with null', () => {
      createInterestsWithNull = () => {
        // @ts-expect-error
        new ValueObjects.Interests(null).valueOf();
      };
    });
    Then('an error should be thrown indicating the interests are invalid', () => {
      expect(createInterestsWithNull).toThrow(/Wrong raw value type/i);
    });
  });

  Scenario('Creating interests with undefined', ({ When, Then }) => {
    let createInterestsWithUndefined: () => void;
    When('I try to create interests with undefined', () => {
      createInterestsWithUndefined = () => {
        // @ts-expect-error
        new ValueObjects.Interests(undefined).valueOf();
      };
    });
    Then('an error should be thrown indicating the interests are invalid', () => {
      expect(createInterestsWithUndefined).toThrow(/Wrong raw value type/i);
    });
  });
});