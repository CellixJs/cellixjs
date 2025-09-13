import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import { VendorUser, type VendorUserProps } from './vendor-user.ts';
import { VendorUserCreatedEvent } from '../../../events/types/vendor-user-created.ts';
import { DomainSeedwork } from '@cellix/domain-seedwork';
import type { Passport } from '../../passport.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/vendor-user.feature'),
);

function makePassport(
  canManageVendorUsers = false,
  isEditingOwnAccount = false
): Passport {
  return vi.mocked({
    user: {
      forVendorUser: vi.fn(() => ({
        determineIf: (
          fn: (p: { canManageVendorUsers: boolean; isEditingOwnAccount: boolean }) => boolean
        ) => fn({ canManageVendorUsers, isEditingOwnAccount }),
      })),
    },
  } as unknown as Passport);
}

function makeBaseProps(
  overrides: Partial<VendorUserProps> = {},
): VendorUserProps {
  return {
    id: 'vendor-1',
    email: 'alice@vendor.com',
    displayName: 'Alice Smith',
    externalId: '123e4567-e89b-12d3-a456-426614174000',
    accessBlocked: false,
    tags: [],
    userType: 'vendor-user',
    createdAt: new Date('2020-01-01T00:00:00Z'),
    updatedAt: new Date('2020-01-02T00:00:00Z'),
    schemaVersion: '1.0.0',
    personalInformation: {
      identityDetails: {
        lastName: 'Smith',
        legalNameConsistsOfOneName: false,
        restOfName: 'Alice',
      },
      contactInformation: {
        email: 'alice@vendor.com',
      },
    },
    ...overrides,
  };
}

function getIntegrationEvent<T>(
  events: readonly unknown[],
  eventClass: new (aggregateId: string) => T,
): T | undefined {
  return events.find((e) => e instanceof eventClass) as T | undefined;
}

describeFeature(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  let passport: Passport;
  let baseProps: VendorUserProps;
  let vendorUser: VendorUser<VendorUserProps>;
  let newVendorUser: VendorUser<VendorUserProps>;

  BeforeEachScenario(() => {
    passport = makePassport(true, true);
    baseProps = makeBaseProps();
    vendorUser = new VendorUser(baseProps, passport);
    newVendorUser = undefined as unknown as VendorUser<VendorUserProps>;
  });

  Background(({ Given, And }) => {
    Given('a valid Passport with vendor user permissions', () => {
      passport = makePassport(true, true);
    });
    And(
      'base vendor user properties with email "alice@vendor.com", displayName "Alice Smith", externalId "123e4567-e89b-12d3-a456-426614174000", accessBlocked false, tags [], userType "vendor-user", and valid timestamps',
      () => {
        baseProps = makeBaseProps();
        vendorUser = new VendorUser(baseProps, passport);
      },
    );
  });

  Scenario('Creating a new vendor user instance with restOfName', ({ When, Then, And }) => {
    When(
      'I create a new VendorUser aggregate using getNewUser with externalId "123e4567-e89b-12d3-a456-426614174000", lastName "Smith", and restOfName "Alice"',
      () => {
        newVendorUser = VendorUser.getNewUser(
          makeBaseProps(),
          passport,
          '123e4567-e89b-12d3-a456-426614174000',
          'Smith',
          'Alice'
        );
      },
    );
    Then('the vendor user\'s externalId should be "123e4567-e89b-12d3-a456-426614174000"', () => {
      expect(newVendorUser.externalId).toBe('123e4567-e89b-12d3-a456-426614174000');
    });
    And('the vendor user\'s displayName should be "Alice Smith"', () => {
      expect(newVendorUser.displayName).toBe('Alice Smith');
    });
    And('a VendorUserCreatedEvent should be added to integration events', () => {
      const event = getIntegrationEvent(
        newVendorUser.getIntegrationEvents(),
        VendorUserCreatedEvent,
      );
      expect(event).toBeDefined();
      expect(event).toBeInstanceOf(VendorUserCreatedEvent);
    });
  });

  Scenario('Creating a new vendor user instance with no restOfName', ({ When, Then, And }) => {
    When(
      'I create a new VendorUser aggregate using getNewUser with externalId "123e4567-e89b-12d3-a456-426614174000", lastName "Smith", and no restOfName',
      () => {
        newVendorUser = VendorUser.getNewUser(
          makeBaseProps(),
          passport,
          '123e4567-e89b-12d3-a456-426614174000',
          'Smith'
        );
      },
    );
    Then('the vendor user\'s displayName should be "Smith"', () => {
      expect(newVendorUser.displayName).toBe('Smith');
    });
    And('the vendor user\'s externalId should be "123e4567-e89b-12d3-a456-426614174000"', () => {
      expect(newVendorUser.externalId).toBe('123e4567-e89b-12d3-a456-426614174000');
    });
    And('a VendorUserCreatedEvent should be added to integration events', () => {
      const event = getIntegrationEvent(
        newVendorUser.getIntegrationEvents(),
        VendorUserCreatedEvent,
      );
      expect(event).toBeDefined();
      expect(event).toBeInstanceOf(VendorUserCreatedEvent);
    });
  });

  // email
  Scenario('Changing the email', ({ Given, When, Then }) => {
    Given('a VendorUser aggregate', () => {
      vendorUser = new VendorUser(makeBaseProps(), passport);
    });
    When('I set the email to "bob@vendor.com"', () => {
      vendorUser.email = 'bob@vendor.com';
    });
    Then('the vendor user\'s email should be "bob@vendor.com"', () => {
      expect(vendorUser.email).toBe('bob@vendor.com');
    });
  });

  Scenario('Changing the email to an invalid value', ({ Given, When, Then }) => {
    let changingEmailToInvalid: () => void;
    Given('a VendorUser aggregate', () => {
      vendorUser = new VendorUser(makeBaseProps(), passport);
    });
    When('I try to set the email to "not-an-email"', () => {
      changingEmailToInvalid = () => {
        vendorUser.email = 'not-an-email';
      };
    });
    Then('an error should be thrown indicating the email is invalid', () => {
      expect(changingEmailToInvalid).toThrow("Value doesn't match pattern");
    });
  });

  // displayName
  Scenario('Changing the displayName with permission to edit own account', ({ Given, When, Then }) => {
    Given('a VendorUser aggregate with permission to edit own account', () => {
      passport = makePassport(false, true);
      vendorUser = new VendorUser(makeBaseProps(), passport);
    });
    When('I set the displayName to "Alice J. Smith"', () => {
      vendorUser.displayName = 'Alice J. Smith';
    });
    Then('the vendor user\'s displayName should be "Alice J. Smith"', () => {
      expect(vendorUser.displayName).toBe('Alice J. Smith');
    });
  });

  Scenario('Changing the displayName with permission to manage vendor users', ({ Given, When, Then }) => {
    Given('a VendorUser aggregate with permission to manage vendor users', () => {
      passport = makePassport(true, false);
      vendorUser = new VendorUser(makeBaseProps(), passport);
    });
    When('I set the displayName to "Alice J. Smith"', () => {
      vendorUser.displayName = 'Alice J. Smith';
    });
    Then('the vendor user\'s displayName should be "Alice J. Smith"', () => {
      expect(vendorUser.displayName).toBe('Alice J. Smith');
    });
  });

  Scenario('Changing the displayName without permission', ({ Given, When, Then }) => {
    let changingDisplayNameWithoutPermission: () => void;
    Given('a VendorUser aggregate without permission to manage vendor users or edit own account', () => {
      passport = makePassport(false, false);
      vendorUser = new VendorUser(makeBaseProps(), passport);
    });
    When('I try to set the displayName to "Alice J. Smith"', () => {
      changingDisplayNameWithoutPermission = () => {
        vendorUser.displayName = 'Alice J. Smith';
      };
    });
    Then('a PermissionError should be thrown', () => {
      expect(changingDisplayNameWithoutPermission).toThrow(DomainSeedwork.PermissionError);
      expect(changingDisplayNameWithoutPermission).toThrow('Unauthorized');
    });
  });

  Scenario('Changing the displayName to an invalid value', ({ Given, When, Then }) => {
    let changingDisplayNameToInvalid: () => void;
    Given('a VendorUser aggregate with permission to manage vendor users or edit own account', () => {
      passport = makePassport(true, true);
      vendorUser = new VendorUser(makeBaseProps(), passport);
    });
    When('I try to set the displayName to an invalid value (e.g., empty string)', () => {
      changingDisplayNameToInvalid = () => {
        vendorUser.displayName = '';
      };
    });
    Then('an error should be thrown indicating the value is invalid', () => {
      expect(changingDisplayNameToInvalid).toThrow('Too short');
    });
  });

  // externalId
  Scenario('Changing the externalId with permission to manage vendor users', ({ Given, When, Then }) => {
    Given('a VendorUser aggregate with permission to manage vendor users', () => {
      passport = makePassport(true, false);
      vendorUser = new VendorUser(makeBaseProps(), passport);
    });
    When('I set the externalId to "123e4567-e89b-12d3-a456-426614174001"', () => {
      vendorUser.externalId = '123e4567-e89b-12d3-a456-426614174001';
    });
    Then('the vendor user\'s externalId should be "123e4567-e89b-12d3-a456-426614174001"', () => {
      expect(vendorUser.externalId).toBe('123e4567-e89b-12d3-a456-426614174001');
    });
  });

  Scenario('Changing the externalId without permission to manage vendor users', ({ Given, When, Then }) => {
    let changingExternalIdWithoutPermission: () => void;
    Given('a VendorUser aggregate without permission to manage vendor users', () => {
      passport = makePassport(false, true);
      vendorUser = new VendorUser(makeBaseProps(), passport);
    });
    When('I try to set the externalId to "123e4567-e89b-12d3-a456-426614174001"', () => {
      changingExternalIdWithoutPermission = () => {
        vendorUser.externalId = '123e4567-e89b-12d3-a456-426614174001';
      };
    });
    Then('an error should be thrown indicating unauthorized', () => {
      expect(changingExternalIdWithoutPermission).toThrow('Unauthorized');
    });
  });

  Scenario('Changing the externalId to an invalid value', ({ Given, When, Then }) => {
    let changingExternalIdToInvalid: () => void;
    Given('a VendorUser aggregate with permission to manage vendor users', () => {
      passport = makePassport(true, false);
      vendorUser = new VendorUser(makeBaseProps(), passport);
    });
    When('I try to set the externalId to an invalid value', () => {
      changingExternalIdToInvalid = () => {
        vendorUser.externalId = 'a'.repeat(36);
      };
    });
    Then('an error should be thrown indicating the value is invalid', () => {
      expect(changingExternalIdToInvalid).toThrow("Value doesn't match pattern");
    });
  });

  // accessBlocked
  Scenario('Changing accessBlocked with permission to manage vendor users', ({ Given, When, Then }) => {
    Given('a VendorUser aggregate with permission to manage vendor users', () => {
      passport = makePassport(true, false);
      vendorUser = new VendorUser(makeBaseProps(), passport);
    });
    When('I set accessBlocked to true', () => {
      vendorUser.accessBlocked = true;
    });
    Then('the vendor user\'s accessBlocked should be true', () => {
      expect(vendorUser.accessBlocked).toBe(true);
    });
  });

  Scenario('Changing accessBlocked without permission to manage vendor users', ({ Given, When, Then }) => {
    let changingAccessBlockedWithoutPermission: () => void;
    Given('a VendorUser aggregate without permission to manage vendor users', () => {
      passport = makePassport(false, true);
      vendorUser = new VendorUser(makeBaseProps(), passport);
    });
    When('I try to set accessBlocked to true', () => {
      changingAccessBlockedWithoutPermission = () => {
        vendorUser.accessBlocked = true;
      };
    });
    Then('an error should be thrown indicating unauthorized', () => {
      expect(changingAccessBlockedWithoutPermission).toThrow('Unauthorized');
    });
  });

  // tags
  Scenario('Changing tags with permission to manage vendor users', ({ Given, When, Then }) => {
    Given('a VendorUser aggregate with permission to manage vendor users', () => {
      passport = makePassport(true, false);
      vendorUser = new VendorUser(makeBaseProps(), passport);
    });
    When('I set tags to ["tag1", "tag2"]', () => {
      vendorUser.tags = ['tag1', 'tag2'];
    });
    Then('the vendor user\'s tags should be ["tag1", "tag2"]', () => {
      expect(vendorUser.tags).toEqual(['tag1', 'tag2']);
    });
  });

  Scenario('Changing tags without permission to manage vendor users', ({ Given, When, Then }) => {
    let changingTagsWithoutPermission: () => void;
    Given('a VendorUser aggregate without permission to manage vendor users', () => {
      passport = makePassport(false, true);
      vendorUser = new VendorUser(makeBaseProps(), passport);
    });
    When('I try to set tags to ["tag1", "tag2"]', () => {
      changingTagsWithoutPermission = () => {
        vendorUser.tags = ['tag1', 'tag2'];
      };
    });
    Then('an error should be thrown indicating unauthorized', () => {
      expect(changingTagsWithoutPermission).toThrow('Unauthorized');
    });
  });

  // readonly properties
  Scenario('Getting userType, createdAt, updatedAt, and schemaVersion', ({ Given, Then, And }) => {
    Given('a VendorUser aggregate', () => {
      passport = makePassport(true, true);
      vendorUser = new VendorUser(makeBaseProps(), passport);
    });
    Then('the userType property should return the correct type', () => {
      expect(vendorUser.userType).toBe('vendor-user');
    });
    And('the createdAt property should return the correct date', () => {
      expect(vendorUser.createdAt).toEqual(new Date('2020-01-01T00:00:00.000Z'));
    });
    And('the updatedAt property should return the correct date', () => {
      expect(vendorUser.updatedAt).toEqual(new Date('2020-01-02T00:00:00.000Z'));
    });
    And('the schemaVersion property should return the correct version', () => {
      expect(vendorUser.schemaVersion).toBe('1.0.0');
    });
  });
});