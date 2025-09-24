import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import { EndUserContactInformation } from './end-user-contact-information.ts';
import type { UserDomainPermissions } from '../user.domain-permissions.ts';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/end-user-contact-information.feature'),
);

function makeVisa(overrides: Partial<UserDomainPermissions> = {}) {
  return vi.mocked({
    determineIf: vi.fn((fn) =>
      fn({
        isEditingOwnAccount: overrides.isEditingOwnAccount ?? true,
        canManageEndUsers: overrides.canManageEndUsers ?? false,
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

function makeRoot() {
    return {
        get isNew(): boolean { return false; },
        addIntegrationEvent: vi.fn(),
        addDomainEvent: vi.fn()
    }
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  let visa: ReturnType<typeof makeVisa>;
  let props: ReturnType<typeof makeProps>;
  let root: ReturnType<typeof makeRoot>;
  let entity: EndUserContactInformation;

  BeforeEachScenario(() => {
    visa = makeVisa();
    props = makeProps();
    root = makeRoot();
    entity = new EndUserContactInformation(props, visa, root);
  });

  Background(({ Given, And }) => {
    Given('valid EndUserContactInformationProps with email "alice@cellix.com"', () => {
      props = makeProps();
    });
    And('a valid UserVisa', () => {
      visa = makeVisa();
    });
  });

  Scenario('Creating a new EndUserContactInformation instance', ({ When, Then }) => {
    let newEntity: EndUserContactInformation;
    When('I create a new EndUserContactInformation using getNewInstance with the email', () => {
      newEntity = new EndUserContactInformation(
        props,
        visa,
        root
      );
    });
    Then('the entity\'s email should be set to "alice@cellix.com"', () => {
      expect(newEntity.email).toBe('alice@cellix.com');
    });
  });

  Scenario('Changing the email with permission to edit own account', ({ Given, When, Then }) => {
    Given('an EndUserContactInformation entity with permission to edit own account', () => {
      visa = makeVisa({ isEditingOwnAccount: true, canManageEndUsers: false });
      entity = new EndUserContactInformation(makeProps(), visa, root);
    });
    When('I set the email to "bob@cellix.com"', () => {
      entity.email = 'bob@cellix.com';
    });
    Then('the entity\'s email should be "bob@cellix.com"', () => {
      expect(entity.email).toBe('bob@cellix.com');
    });
  });

  Scenario('Changing the email with permission to manage end users', ({ Given, When, Then }) => {
    Given('an EndUserContactInformation entity with permission to manage end users', () => {
      visa = makeVisa({ isEditingOwnAccount: false, canManageEndUsers: true });
      entity = new EndUserContactInformation(makeProps(), visa, root);
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
    Given('an EndUserContactInformation entity without permission to edit own account or manage end users', () => {
      visa = makeVisa({ isEditingOwnAccount: false, canManageEndUsers: false });
      entity = new EndUserContactInformation(makeProps(), visa, root);
    });
    When('I try to set the email to "bob@cellix.com"', () => {
      changingEmailWithoutPermission = () => {
        entity.email = 'bob@cellix.com';
      };
    });
    Then('a PermissionError should be thrown', () => {
      expect(changingEmailWithoutPermission).toThrow('Cannot set email');
    });
  });

  Scenario('Changing the email to an invalid value', ({ Given, When, Then }) => {
    let changingEmailToInvalidValue: () => void;
    Given('an EndUserContactInformation entity with permission to edit own account', () => {
      visa = makeVisa();
      entity = new EndUserContactInformation(makeProps(), visa, root);
    });
    When('I try to set the email to "not-an-email"', () => {
      changingEmailToInvalidValue = () => {
        entity.email = 'not-an-email';
      };
    });
    Then('an error should be thrown indicating the email is invalid', () => {
      expect(changingEmailToInvalidValue).toThrow("Value doesn't match pattern");
    });
  });
});