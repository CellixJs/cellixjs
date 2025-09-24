import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { SystemPassportBase, type PermissionsSpec } from './system.passport-base.ts';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/system.passport-base.feature'),
);

// Create a concrete test class since SystemPassportBase is abstract
class TestSystemPassport extends SystemPassportBase {
  getPermissions() {
    return this.permissions;
  }
}

test.for(feature, ({ Scenario }) => {
  let passport: TestSystemPassport;
  let permissions: Partial<PermissionsSpec>;
  let result: Partial<PermissionsSpec>;

  Scenario('Creating SystemPassportBase with no permissions', ({ Given, When, Then, And }) => {
    Given('I have no permissions', () => {
      permissions = {};
    });

    When('I create a SystemPassportBase with no permissions', () => {
      passport = new TestSystemPassport();
    });

    And('I access the protected permissions property', () => {
      result = passport.getPermissions();
    });

    Then('it should return an empty permissions object', () => {
      expect(result).toEqual({});
    });
  });

  Scenario('Creating SystemPassportBase with provided permissions', ({ Given, When, Then, And }) => {
    Given('I have permissions object with canManageMembers true and canManageCommunities false', () => {
      permissions = {
        canManageMembers: true,
        canCreateCommunities: false
      } as Partial<PermissionsSpec>;
    });

    When('I create a SystemPassportBase with these permissions', () => {
      passport = new TestSystemPassport(permissions);
    });

    And('I access the protected permissions property', () => {
      result = passport.getPermissions();
    });

    Then('it should return the same permissions object', () => {
      expect(result).toEqual(permissions);
    });
  });

  Scenario('Creating SystemPassportBase with partial permissions', ({ Given, When, Then, And }) => {
    Given('I have a partial permissions object with only canManageMembers true', () => {
      permissions = {
        canManageMembers: true
      };
    });

    When('I create a SystemPassportBase with these permissions', () => {
      passport = new TestSystemPassport(permissions);
    });

    And('I access the protected permissions property', () => {
      result = passport.getPermissions();
    });

    Then('it should return the partial permissions object', () => {
      expect(result).toEqual(permissions);
    });
  });

  Scenario('Creating SystemPassportBase with undefined permissions', ({ Given, When, Then, And }) => {
    Given('I pass undefined as permissions', () => {
      permissions = undefined as unknown as Partial<PermissionsSpec>;
    });

    When('I create a SystemPassportBase with undefined permissions', () => {
      passport = new TestSystemPassport(permissions);
    });

    And('I access the protected permissions property', () => {
      result = passport.getPermissions();
    });

    Then('it should return an empty permissions object', () => {
      expect(result).toEqual({});
    });
  });
});