import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { SystemPassportBase } from './system.passport-base.ts';

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

describeFeature(feature, ({ given, when, then, and }) => {
  let passport: TestSystemPassport;
  let permissions: any;
  let result: any;

  given('I create a SystemPassportBase with no permissions', () => {
    // This will be done in the when step
  });

  given('I have permissions object with canManageMembers true and canManageCommunities false', () => {
    permissions = {
      canManageMembers: true,
      canManageCommunities: false
    };
  });

  given('I have a partial permissions object with only canManageMembers true', () => {
    permissions = {
      canManageMembers: true
    };
  });

  given('I pass undefined as permissions', () => {
    permissions = undefined;
  });

  when('I access the protected permissions property', () => {
    result = passport.getPermissions();
  });

  when('I create a SystemPassportBase with these permissions', () => {
    passport = new TestSystemPassport(permissions);
  });

  when('I create a SystemPassportBase with undefined permissions', () => {
    passport = new TestSystemPassport(permissions);
  });

  and('I access the protected permissions property', () => {
    result = passport.getPermissions();
  });

  then('it should return an empty permissions object', () => {
    expect(result).toEqual({});
  });

  then('it should return the same permissions object', () => {
    expect(result).toEqual(permissions);
  });

  then('it should return the partial permissions object', () => {
    expect(result).toEqual(permissions);
  });
});