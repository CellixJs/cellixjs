import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import { VendorUserContactInformation } from './vendor-user-contact-information.ts';
import type { UserDomainPermissions } from '../user.domain-permissions.ts';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/vendor-user-contact-information.feature'),
);

function makeVisa(overrides: Partial<UserDomainPermissions> = {}) {
  return vi.mocked({
    determineIf: vi.fn((fn) =>
      fn({
        isEditingOwnAccount: overrides.isEditingOwnAccount ?? true,
        canManageVendorUsers: overrides.canManageVendorUsers ?? false,
      })
    ),
  });
}

function makeProps(overrides = {}) {
  return {
    email: 'alice@cellix.com',
    ...overrides,
  };
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  let visa: ReturnType<typeof makeVisa>;
  let props: ReturnType<typeof makeProps>;
  let entity: VendorUserContactInformation;

  BeforeEachScenario(() => {
    visa = makeVisa();
    props = makeProps();
    entity = new VendorUserContactInformation(props, visa);
  });

  Background(({ Given, And }) => {
    Given('valid VendorUserContactInformationProps with email "alice@cellix.com"', () => {
      props = makeProps();
    });
    And('a valid UserVisa', () => {
      visa = makeVisa();
    });
  });

  Scenario('Creating a new VendorUserContactInformation instance', ({ When, Then }) => {
    let newEntity: VendorUserContactInformation;
    When('I create a new VendorUserContactInformation using getNewInstance with the email', () => {
      newEntity = VendorUserContactInformation.getNewInstance(
        props,
        visa,
        'alice@cellix.com'
      );
    });
    Then('the entity\'s email should be set to "alice@cellix.com"', () => {
      expect(newEntity.email).toBe('alice@cellix.com');
    });
  });

  Scenario('Changing the email with permission to edit own account', ({ Given, When, Then }) => {
    Given('an VendorUserContactInformation entity with permission to edit own account', () => {
      visa = makeVisa({ isEditingOwnAccount: true, canManageVendorUsers: false });
      entity = new VendorUserContactInformation(makeProps(), visa);
    });
    When('I set the email to "bob@cellix.com"', () => {
      entity.email = 'bob@cellix.com';
    });
    Then('the entity\'s email should be "bob@cellix.com"', () => {
      expect(entity.email).toBe('bob@cellix.com');
    });
  });

  Scenario('Changing the email with permission to manage vendor users', ({ Given, When, Then }) => {
    Given('an VendorUserContactInformation entity with permission to manage vendor users', () => {
      visa = makeVisa({ isEditingOwnAccount: false, canManageVendorUsers: true });
      entity = new VendorUserContactInformation(makeProps(), visa);
    });
    When('I set the email to "bob@cellix.com"', () => {
      entity.email = 'bob@cellix.com';
    });
    Then('the entity\'s email should be "bob@cellix.com"', () => {
      expect(entity.email).toBe('bob@cellix.com');
    });
  });

  Scenario('Changing the email without permission', ({ Given, When, Then }) => {
    let changingEmailWithoutPermission: () => void;
    Given('an VendorUserContactInformation entity without permission to edit own account or manage vendor users', () => {
      visa = makeVisa({ isEditingOwnAccount: false, canManageVendorUsers: false });
      entity = new VendorUserContactInformation(makeProps(), visa);
    });
    When('I try to set the email to "bob@cellix.com"', () => {
      changingEmailWithoutPermission = () => {
        entity.email = 'bob@cellix.com';
      };
    });
    Then('a PermissionError should be thrown', () => {
      expect(changingEmailWithoutPermission).throws('Cannot set email');
    });
  });

  Scenario('Changing the email to an invalid value', ({ Given, When, Then }) => {
    let changingEmailToInvalidValue: () => void;
    Given('an VendorUserContactInformation entity with permission to edit own account', () => {
      visa = makeVisa();
      entity = new VendorUserContactInformation(makeProps(), visa);
    });
    When('I try to set the email to "not-an-email"', () => {
      changingEmailToInvalidValue = () => {
        entity.email = 'not-an-email';
      };
    });
    Then('an error should be thrown indicating the email is invalid', () => {
      expect(changingEmailToInvalidValue).throws('Value doesn\'t match pattern');
    });
  });
});