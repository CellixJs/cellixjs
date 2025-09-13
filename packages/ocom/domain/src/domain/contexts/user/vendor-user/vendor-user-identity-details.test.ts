import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import { DomainSeedwork } from '@cellix/domain-seedwork';
import { VendorUserIdentityDetails } from './vendor-user-identity-details.ts';
import type { UserDomainPermissions } from '../user.domain-permissions.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/vendor-user-identity-details.feature'),
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
    lastName: 'Smith',
    legalNameConsistsOfOneName: false,
    restOfName: 'Alice',
    ...overrides,
  };
}

describeFeature(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  let visa: ReturnType<typeof makeVisa>;
  let props: ReturnType<typeof makeProps>;
  let entity: VendorUserIdentityDetails;

  BeforeEachScenario(() => {
    visa = makeVisa();
    props = makeProps();
    entity = new VendorUserIdentityDetails(props, visa);
  });

  Background(({ Given, And }) => {
    Given(
      'valid VendorUserIdentityDetailsProps with lastName "Smith", legalNameConsistsOfOneName false, and restOfName "Alice"',
      () => {
        props = makeProps();
      }
    );
    And('a valid UserVisa', () => {
      visa = makeVisa();
    });
  });

  Scenario('Creating a new VendorUserIdentityDetails instance', ({ When, Then, And }) => {
    let newEntity: VendorUserIdentityDetails;
    When(
      'I create a new VendorUserIdentityDetails using getNewInstance with lastName "Smith", legalNameConsistsOfOneName false, and restOfName "Alice"',
      () => {
        newEntity = VendorUserIdentityDetails.getNewInstance(
          props,
          visa,
          'Smith',
          false,
          'Alice'
        );
      }
    );
    Then("the entity's lastName should be \"Smith\"", () => {
      expect(newEntity.lastName).toBe('Smith');
    });
    And("the entity's legalNameConsistsOfOneName should be false", () => {
      expect(newEntity.legalNameConsistsOfOneName).toBe(false);
    });
    And("the entity's restOfName should be \"Alice\"", () => {
      expect(newEntity.restOfName).toBe('Alice');
    });
  });

  Scenario('Changing the lastName with permission to edit own account', ({ Given, When, Then }) => {
    Given('an VendorUserIdentityDetails entity with permission to edit own account', () => {
      visa = makeVisa({ isEditingOwnAccount: true, canManageVendorUsers: false });
      entity = new VendorUserIdentityDetails(makeProps(), visa);
    });
    When('I set the lastName to "Johnson"', () => {
      entity.lastName = 'Johnson';
    });
    Then("the entity's lastName should be \"Johnson\"", () => {
      expect(entity.lastName).toBe('Johnson');
    });
  });

  Scenario('Changing the lastName with permission to manage vendor users', ({ Given, When, Then }) => {
    Given('an VendorUserIdentityDetails entity with permission to manage vendor users', () => {
      visa = makeVisa({ isEditingOwnAccount: false, canManageVendorUsers: true });
      entity = new VendorUserIdentityDetails(makeProps(), visa);
    });
    When('I set the lastName to "Johnson"', () => {
      entity.lastName = 'Johnson';
    });
    Then("the entity's lastName should be \"Johnson\"", () => {
      expect(entity.lastName).toBe('Johnson');
    });
  });

  Scenario('Changing the lastName without permission', ({ Given, When, Then }) => {
    let changingLastNameWithoutPermission: () => void;
    Given('an VendorUserIdentityDetails entity without permission to edit own account or manage vendor users', () => {
      visa = makeVisa({ isEditingOwnAccount: false, canManageVendorUsers: false });
      entity = new VendorUserIdentityDetails(makeProps(), visa);
    });
    When('I try to set the lastName to "Johnson"', () => {
      changingLastNameWithoutPermission = () => {
        entity.lastName = 'Johnson';
      };
    });
    Then('a PermissionError should be thrown', () => {
      expect(changingLastNameWithoutPermission).toThrow(DomainSeedwork.PermissionError);
      expect(changingLastNameWithoutPermission).toThrow('Cannot set identity details');
    });
  });

  Scenario('Changing the lastName to an invalid value', ({ Given, When, Then }) => {
    let changingLastNameToInvalidValue: () => void;
    Given('an VendorUserIdentityDetails entity with permission to edit own account', () => {
      visa = makeVisa({ isEditingOwnAccount: true });
      entity = new VendorUserIdentityDetails(makeProps(), visa);
    });
    When('I try to set the lastName to an empty string', () => {
      changingLastNameToInvalidValue = () => {
        entity.lastName = '';
      };
    });
    Then('an error should be thrown indicating the lastName is too short', () => {
      expect(changingLastNameToInvalidValue).toThrow('Too short');
    });
  });

  Scenario('Changing the legalNameConsistsOfOneName with permission to edit own account', ({ Given, When, Then }) => {
    Given('an VendorUserIdentityDetails entity with permission to edit own account', () => {
      visa = makeVisa({ isEditingOwnAccount: true });
      entity = new VendorUserIdentityDetails(makeProps(), visa);
    });
    When('I set the legalNameConsistsOfOneName to true', () => {
      entity.legalNameConsistsOfOneName = true;
    });
    Then("the entity's legalNameConsistsOfOneName should be true", () => {
      expect(entity.legalNameConsistsOfOneName).toBe(true);
    });
  });

  Scenario('Changing the legalNameConsistsOfOneName with permission to manage vendor users', ({ Given, When, Then }) => {
    Given('an VendorUserIdentityDetails entity with permission to manage vendor users', () => {
      visa = makeVisa({ canManageVendorUsers: true });
      entity = new VendorUserIdentityDetails(makeProps(), visa);
    });
    When('I set the legalNameConsistsOfOneName to true', () => {
      entity.legalNameConsistsOfOneName = true;
    });
    Then("the entity's legalNameConsistsOfOneName should be true", () => {
      expect(entity.legalNameConsistsOfOneName).toBe(true);
    });
  });

  Scenario('Changing the legalNameConsistsOfOneName without permission', ({ Given, When, Then }) => {
    let changeLegalNameFlagWithoutPermission: () => void;
    Given('an VendorUserIdentityDetails entity without permission to edit own account or manage vendor users', () => {
      visa = makeVisa({ isEditingOwnAccount: false, canManageVendorUsers: false });
      entity = new VendorUserIdentityDetails(makeProps(), visa);
    });
    When('I try to set the legalNameConsistsOfOneName to true', () => {
      changeLegalNameFlagWithoutPermission = () => {
        entity.legalNameConsistsOfOneName = true;
      };
    });
    Then('a PermissionError should be thrown', () => {
      expect(changeLegalNameFlagWithoutPermission).toThrow('Cannot set identity details');
    });
  });

  Scenario('Changing the restOfName with permission to edit own account', ({ Given, When, Then }) => {
    Given('an VendorUserIdentityDetails entity with permission to edit own account', () => {
      visa = makeVisa({ isEditingOwnAccount: true, canManageVendorUsers: false });
      entity = new VendorUserIdentityDetails(makeProps(), visa);
    });
    When('I set the restOfName to "Bob"', () => {
      entity.restOfName = 'Bob';
    });
    Then("the entity's restOfName should be \"Bob\"", () => {
      expect(entity.restOfName).toBe('Bob');
    });
  });

  Scenario('Changing the restOfName with permission to manage vendor users', ({ Given, When, Then }) => {
    Given('an VendorUserIdentityDetails entity with permission to manage vendor users', () => {
      visa = makeVisa({ canManageVendorUsers: true, isEditingOwnAccount: false });
      entity = new VendorUserIdentityDetails(makeProps(), visa);
    });
    When('I set the restOfName to "Bob"', () => {
      entity.restOfName = 'Bob';
    });
    Then("the entity's restOfName should be \"Bob\"", () => {
      expect(entity.restOfName).toBe('Bob');
    });
  });

  Scenario('Changing the restOfName without permission', ({ Given, When, Then }) => {
    let changingRestOfNameWithoutPermission: () => void;
    Given('an VendorUserIdentityDetails entity without permission to edit own account or manage vendor users', () => {
      visa = makeVisa({ isEditingOwnAccount: false, canManageVendorUsers: false });
      entity = new VendorUserIdentityDetails(makeProps(), visa);
    });
    When('I try to set the restOfName to "Bob"', () => {
      changingRestOfNameWithoutPermission = () => {
        entity.restOfName = 'Bob';
      };
    });
    Then('a PermissionError should be thrown', () => {
      expect(changingRestOfNameWithoutPermission).toThrow('Cannot set identity details');
    });
  });

  Scenario('Changing the restOfName to an invalid value', ({ Given, When, Then }) => {
    let changeRestOfNameToInvalidValue: () => void;
    Given('an VendorUserIdentityDetails entity with permission to edit own account', () => {
      visa = makeVisa({ isEditingOwnAccount: true });
      entity = new VendorUserIdentityDetails(makeProps(), visa);
    });
    When('I try to set the restOfName to an empty string', () => {
      changeRestOfNameToInvalidValue = () => {
        entity.restOfName = '';
      };
    });
    Then('an error should be thrown indicating the restOfName is too short', () => {
      expect(changeRestOfNameToInvalidValue).throws('Too short');
    });
  });

  Scenario('Clearing the restOfName with permission', ({ Given, When, Then }) => {
    Given('an VendorUserIdentityDetails entity with permission to edit own account', () => {
      visa = makeVisa({ isEditingOwnAccount: true });
      entity = new VendorUserIdentityDetails(makeProps(), visa);
    });
    When('I set the restOfName to undefined', () => {
      entity.restOfName = undefined;
    });
    Then("the entity's restOfName should be undefined", () => {
      expect(entity.restOfName).toBeUndefined();
    });
  });
});