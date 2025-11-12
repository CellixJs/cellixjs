import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';

import { StaffRoleServicePermissions } from './staff-role-service-permissions.ts';
import * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/staff-role-service-permissions.feature'),
);

function makeVisa({ canManageStaffRolesAndPermissions = true, isSystemAccount = false } = {}) {
  return vi.mocked({
    determineIf: vi.fn((fn) =>
      fn({ canManageStaffRolesAndPermissions, isSystemAccount })
    ),
  });
}

function makeProps(overrides = {}) {
  return {
    canManageServices: false,
    ...overrides,
  };
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  let visa: ReturnType<typeof makeVisa>;
  let props: ReturnType<typeof makeProps>;
  let entity: StaffRoleServicePermissions;

  BeforeEachScenario(() => {
    visa = makeVisa();
    props = makeProps();
    entity = new StaffRoleServicePermissions(props, visa);
  });

  Background(({ Given, And }) => {
    Given('valid StaffRoleServicePermissionsProps with all permission flags set to false', () => {
      props = makeProps();
    });
    And('a valid UserVisa', () => {
      visa = makeVisa();
    });
  });

  // canManageServices
  Scenario('Changing canManageServices with manage staff roles permission', ({ Given, When, Then }) => {
    Given('a StaffRoleServicePermissions entity with permission to manage staff roles', () => {
      visa = makeVisa({ canManageStaffRolesAndPermissions: true, isSystemAccount: false });
      entity = new StaffRoleServicePermissions(makeProps(), visa);
    });
    When('I set canManageServices to true', () => {
      entity.canManageServices = true;
    });
    Then('the property should be updated to true', () => {
      expect(entity.canManageServices).toBe(true);
    });
  });

  Scenario('Changing canManageServices with system account permission', ({ Given, When, Then }) => {
    Given('a StaffRoleServicePermissions entity with system account permission', () => {
      visa = makeVisa({ canManageStaffRolesAndPermissions: false, isSystemAccount: true });
      entity = new StaffRoleServicePermissions(makeProps(), visa);
    });
    When('I set canManageServices to true', () => {
      entity.canManageServices = true;
    });
    Then('the property should be updated to true', () => {
      expect(entity.canManageServices).toBe(true);
    });
  });

  Scenario('Changing canManageServices without permission', ({ Given, When, Then }) => {
    let setWithoutPermission: () => void;
    Given('a StaffRoleServicePermissions entity without permission to manage staff roles or system account', () => {
      visa = makeVisa({ canManageStaffRolesAndPermissions: false, isSystemAccount: false });
      entity = new StaffRoleServicePermissions(makeProps(), visa);
    });
    When('I try to set canManageServices to true', () => {
      setWithoutPermission = () => {
        entity.canManageServices = true;
      };
    });
    Then('a PermissionError should be thrown', () => {
      expect(setWithoutPermission).toThrow(DomainSeedwork.PermissionError);
      expect(setWithoutPermission).toThrow('Cannot set permission');
    });
  });
});