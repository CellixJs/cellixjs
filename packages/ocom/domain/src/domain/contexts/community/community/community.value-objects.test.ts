import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import * as ValueObjects from './community.value-objects.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/community.value-objects.feature'),
);

describeFeature(feature, ({ Scenario }) => {
  // Name
  Scenario('Creating a name with valid value', ({ When, Then }) => {
    let value: string;
    When('I create a name with "Cellix Community"', () => {
      value = new ValueObjects.Name('Cellix Community').valueOf();
    });
    Then('the value should be "Cellix Community"', () => {
      expect(value).toBe('Cellix Community');
    });
  });

  Scenario('Creating a name with leading and trailing whitespace', ({ When, Then }) => {
    let value: string;
    When('I create a name with "  Cellix Community  "', () => {
      value = new ValueObjects.Name('  Cellix Community  ').valueOf();
    });
    Then('the value should be "Cellix Community"', () => {
      expect(value).toBe('Cellix Community');
    });
  });

  Scenario('Creating a name with maximum allowed length', ({ When, Then }) => {
    let value: string;
    When('I create a name with a string of 200 characters', () => {
      value = new ValueObjects.Name('a'.repeat(200)).valueOf();
    });
    Then('the value should be the 200 character string', () => {
      expect(value).toBe('a'.repeat(200));
    });
  });

  Scenario('Creating a name with more than maximum allowed length', ({ When, Then }) => {
    let createNameAboveMaxLength: () => void;
    When('I try to create a name with a string of 201 characters', () => {
      createNameAboveMaxLength = () => {
        new ValueObjects.Name('a'.repeat(201)).valueOf();
      };
    });
    Then('an error should be thrown indicating the name is too long', () => {
      expect(createNameAboveMaxLength).throws('Too long');
    });
  });

  Scenario('Creating a name with minimum allowed length', ({ When, Then }) => {
    let value: string;
    When('I create a name with a string of 1 character', () => {
      value = new ValueObjects.Name('b').valueOf();
    });
    Then('the value should be the 1 character string', () => {
      expect(value).toBe('b');
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
      expect(createNameBelowMinLength).throws('Too short');
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
      expect(createNameWithNull).throws(/Wrong raw value type/i);
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
      expect(createNameWithUndefined).throws(/Wrong raw value type/i);
    });
  });

  // Domain
  Scenario('Creating a domain with valid value', ({ When, Then }) => {
    let value: string;
    When('I create a domain with "cellix.com"', () => {
      value = new ValueObjects.Domain('cellix.com').valueOf();
    });
    Then('the value should be "cellix.com"', () => {
      expect(value).toBe('cellix.com');
    });
  });

  Scenario('Creating a domain with leading and trailing whitespace', ({ When, Then }) => {
    let value: string;
    When('I create a domain with "  cellix.com  "', () => {
      value = new ValueObjects.Domain('  cellix.com  ').valueOf();
    });
    Then('the value should be "cellix.com"', () => {
      expect(value).toBe('cellix.com');
    });
  });

  Scenario('Creating a domain with maximum allowed length', ({ When, Then }) => {
    let value: string;
    When('I create a domain with a string of 500 characters', () => {
      value = new ValueObjects.Domain('a'.repeat(500)).valueOf();
    });
    Then('the value should be the 500 character string', () => {
      expect(value).toBe('a'.repeat(500));
    });
  });

  Scenario('Creating a domain with more than maximum allowed length', ({ When, Then }) => {
    let createDomainAboveMaxLength: () => void;
    When('I try to create a domain with a string of 501 characters', () => {
      createDomainAboveMaxLength = () => {
        new ValueObjects.Domain('a'.repeat(501)).valueOf();
      };
    });
    Then('an error should be thrown indicating the domain is too long', () => {
      expect(createDomainAboveMaxLength).throws('Too long');
    });
  });

  Scenario('Creating a domain with minimum allowed length', ({ When, Then }) => {
    let value: string;
    When('I create a domain with a string of 1 character', () => {
      value = new ValueObjects.Domain('b').valueOf();
    });
    Then('the value should be the 1 character string', () => {
      expect(value).toBe('b');
    });
  });

  Scenario('Creating a domain with less than minimum allowed length', ({ When, Then }) => {
    let createDomainBelowMinLength: () => void;
    When('I try to create a domain with an empty string', () => {
      createDomainBelowMinLength = () => {
        new ValueObjects.Domain('').valueOf();
      };
    });
    Then('an error should be thrown indicating the domain is too short', () => {
      expect(createDomainBelowMinLength).throws('Too short');
    });
  });

  Scenario('Creating a domain with null', ({ When, Then }) => {
    let createDomainWithNull: () => void;
    When('I try to create a domain with null', () => {
      createDomainWithNull = () => {
        // @ts-expect-error
        new ValueObjects.Domain(null).valueOf();
      };
    });
    Then('an error should be thrown indicating the domain is invalid', () => {
      expect(createDomainWithNull).throws(/Wrong raw value type/i);
    });
  });

  Scenario('Creating a domain with undefined', ({ When, Then }) => {
    let createDomainWithUndefined: () => void;
    When('I try to create a domain with undefined', () => {
      createDomainWithUndefined = () => {
        // @ts-expect-error
        new ValueObjects.Domain(undefined).valueOf();
      };
    });
    Then('an error should be thrown indicating the domain is invalid', () => {
      expect(createDomainWithUndefined).throws(/Wrong raw value type/i);
    });
  });

  // WhiteLabelDomain
  Scenario('Creating a white label domain with valid value', ({ When, Then }) => {
    let value: string;
    When('I create a white label domain with "whitelabel.cellix.com"', () => {
      value = new ValueObjects.WhiteLabelDomain('whitelabel.cellix.com').valueOf() as string;
    });
    Then('the value should be "whitelabel.cellix.com"', () => {
      expect(value).toBe('whitelabel.cellix.com');
    });
  });

  Scenario('Creating a white label domain with leading and trailing whitespace', ({ When, Then }) => {
    let value: string;
    When('I create a white label domain with "  whitelabel.cellix.com  "', () => {
      value = new ValueObjects.WhiteLabelDomain('  whitelabel.cellix.com  ').valueOf() as string;
    });
    Then('the value should be "whitelabel.cellix.com"', () => {
      expect(value).toBe('whitelabel.cellix.com');
    });
  });

  Scenario('Creating a white label domain with maximum allowed length', ({ When, Then }) => {
    let value: string;
    When('I create a white label domain with a string of 500 characters', () => {
      value = new ValueObjects.WhiteLabelDomain('a'.repeat(500)).valueOf() as string;
    });
    Then('the value should be the 500 character string', () => {
      expect(value).toBe('a'.repeat(500));
    });
  });

  Scenario('Creating a white label domain with more than maximum allowed length', ({ When, Then }) => {
    let createWhiteLabelDomainAboveMaxLength: () => void;
    When('I try to create a white label domain with a string of 501 characters', () => {
      createWhiteLabelDomainAboveMaxLength = () => {
        new ValueObjects.WhiteLabelDomain('a'.repeat(501)).valueOf();
      };
    });
    Then('an error should be thrown indicating the white label domain is too long', () => {
      expect(createWhiteLabelDomainAboveMaxLength).throws('Too long');
    });
  });

  Scenario('Creating a white label domain with minimum allowed length', ({ When, Then }) => {
    let value: string;
    When('I create a white label domain with a string of 1 character', () => {
      value = new ValueObjects.WhiteLabelDomain('b').valueOf() as string;
    });
    Then('the value should be the 1 character string', () => {
      expect(value).toBe('b');
    });
  });

  Scenario('Creating a white label domain with less than minimum allowed length', ({ When, Then }) => {
    let createWhiteLabelDomainBelowMinLength: () => void;
    When('I try to create a white label domain with an empty string', () => {
      createWhiteLabelDomainBelowMinLength = () => {
        new ValueObjects.WhiteLabelDomain('').valueOf();
      };
    });
    Then('an error should be thrown indicating the white label domain is too short', () => {
      expect(createWhiteLabelDomainBelowMinLength).throws('Too short');
    });
  });

  Scenario('Creating a white label domain with null', ({ When, Then }) => {
    let value: string | null;
    When('I create a white label domain with null', () => {
      value = new ValueObjects.WhiteLabelDomain(null).valueOf();
    });
    Then('the value should be null', () => {
      expect(value).toBeNull();
    });
  });

  Scenario('Creating a white label domain with undefined', ({ When, Then }) => {
    let createWhiteLabelDomainWithUndefined: () => void;
    When('I try to create a white label domain with undefined', () => {
      createWhiteLabelDomainWithUndefined = () => {
        // @ts-expect-error
        new ValueObjects.WhiteLabelDomain(undefined).valueOf();
      };
    });
    Then('an error should be thrown indicating the white label domain is invalid', () => {
      expect(createWhiteLabelDomainWithUndefined).throws(/Wrong raw value type/i);
    });
  });

  // Handle
  Scenario('Creating a handle with valid value', ({ When, Then }) => {
    let value: string;
    When('I create a handle with "cellix"', () => {
      value = new ValueObjects.Handle('cellix').valueOf() as string;
    });
    Then('the value should be "cellix"', () => {
      expect(value).toBe('cellix');
    });
  });

  Scenario('Creating a handle with leading and trailing whitespace', ({ When, Then }) => {
    let value: string;
    When('I create a handle with "  cellix  "', () => {
      value = new ValueObjects.Handle('  cellix  ').valueOf() as string;
    });
    Then('the value should be "cellix"', () => {
      expect(value).toBe('cellix');
    });
  });

  Scenario('Creating a handle with maximum allowed length', ({ When, Then }) => {
    let value: string;
    When('I create a handle with a string of 50 characters', () => {
      value = new ValueObjects.Handle('a'.repeat(50)).valueOf() as string;
    });
    Then('the value should be the 50 character string', () => {
      expect(value).toBe('a'.repeat(50));
    });
  });

  Scenario('Creating a handle with more than maximum allowed length', ({ When, Then }) => {
    let createHandleAboveMaxLength: () => void;
    When('I try to create a handle with a string of 51 characters', () => {
      createHandleAboveMaxLength = () => {
        new ValueObjects.Handle('a'.repeat(51)).valueOf();
      };
    });
    Then('an error should be thrown indicating the handle is too long', () => {
      expect(createHandleAboveMaxLength).throws('Too long');
    });
  });

  Scenario('Creating a handle with minimum allowed length', ({ When, Then }) => {
    let value: string;
    When('I create a handle with a string of 1 character', () => {
      value = new ValueObjects.Handle('b').valueOf() as string;
    });
    Then('the value should be the 1 character string', () => {
      expect(value).toBe('b');
    });
  });

  Scenario('Creating a handle with less than minimum allowed length', ({ When, Then }) => {
    let createHandleBelowMinLength: () => void;
    When('I try to create a handle with an empty string', () => {
      createHandleBelowMinLength = () => {
        new ValueObjects.Handle('').valueOf();
      };
    });
    Then('an error should be thrown indicating the handle is too short', () => {
      expect(createHandleBelowMinLength).throws('Too short');
    });
  });

  Scenario('Creating a handle with null', ({ When, Then }) => {
    let value: string | null;
    When('I create a handle with null', () => {
      value = new ValueObjects.Handle(null).valueOf();
    });
    Then('the value should be null', () => {
      expect(value).toBeNull();
    });
  });

  Scenario('Creating a handle with undefined', ({ When, Then }) => {
    let createHandleWithUndefined: () => void;
    When('I try to create a handle with undefined', () => {
      createHandleWithUndefined = () => {
        // @ts-expect-error
        new ValueObjects.Handle(undefined).valueOf();
      };
    });
    Then('an error should be thrown indicating the handle is invalid', () => {
      expect(createHandleWithUndefined).throws(/Wrong raw value type/i);
    });
  });
});