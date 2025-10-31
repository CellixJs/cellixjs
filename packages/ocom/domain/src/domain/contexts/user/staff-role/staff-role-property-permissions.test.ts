import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';

import { StaffRolePropertyPermissions } from './staff-role-property-permissions.ts';
import { DomainSeedwork } from '@cellix/domain-seedwork';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/staff-role-property-permissions.feature'),
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
    canManageProperties: false,
    canEditOwnProperty: false,
    ...overrides,
  };
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  let visa: ReturnType<typeof makeVisa>;
  let props: ReturnType<typeof makeProps>;
  let entity: StaffRolePropertyPermissions;

  BeforeEachScenario(() => {
    visa = makeVisa();
    props = makeProps();
    entity = new StaffRolePropertyPermissions(props, visa);
  });

  Background(({ Given, And }) => {
    Given('valid StaffRolePropertyPermissionsProps with all permission flags set to false', () => {
      props = makeProps();
    });
    And('a valid UserVisa', () => {
      visa = makeVisa();
    });
  });

  // canManageProperties
  Scenario('Changing canManageProperties with manage staff roles permission', ({ Given, When, Then }) => {
    Given('a StaffRolePropertyPermissions entity with permission to manage staff roles', () => {
      visa = makeVisa({ canManageStaffRolesAndPermissions: true, isSystemAccount: false });
      entity = new StaffRolePropertyPermissions(makeProps(), visa);
    });
    When('I set canManageProperties to true', () => {
      entity.canManageProperties = true;
    });
    Then('the property should be updated to true', () => {
      expect(entity.canManageProperties).toBe(true);
    });
  });

  Scenario('Changing canManageProperties with system account permission', ({ Given, When, Then }) => {
    Given('a StaffRolePropertyPermissions entity with system account permission', () => {
      visa = makeVisa({ canManageStaffRolesAndPermissions: false, isSystemAccount: true });
      entity = new StaffRolePropertyPermissions(makeProps(), visa);
    });
    When('I set canManageProperties to true', () => {
      entity.canManageProperties = true;
    });
    Then('the property should be updated to true', () => {
      expect(entity.canManageProperties).toBe(true);
    });
  });

  Scenario('Changing canManageProperties without permission', ({ Given, When, Then }) => {
    let setWithoutPermission: () => void;
    Given('a StaffRolePropertyPermissions entity without permission to manage staff roles or system account', () => {
      visa = makeVisa({ canManageStaffRolesAndPermissions: false, isSystemAccount: false });
      entity = new StaffRolePropertyPermissions(makeProps(), visa);
    });
    When('I try to set canManageProperties to true', () => {
      setWithoutPermission = () => {
        entity.canManageProperties = true;
      };
    });
    Then('a PermissionError should be thrown', () => {
      expect(setWithoutPermission).toThrow(DomainSeedwork.PermissionError);
      expect(setWithoutPermission).toThrow('Cannot set permission');
    });
  });

  // canEditOwnProperty
  Scenario('Changing canEditOwnProperty with manage staff roles permission', ({ Given, When, Then }) => {
    Given('a StaffRolePropertyPermissions entity with permission to manage staff roles', () => {
      visa = makeVisa({ canManageStaffRolesAndPermissions: true, isSystemAccount: false });
      entity = new StaffRolePropertyPermissions(makeProps(), visa);
    });
    When('I set canEditOwnProperty to true', () => {
      entity.canEditOwnProperty = true;
    });
    Then('the property should be updated to true', () => {
      expect(entity.canEditOwnProperty).toBe(true);
    });
  });

  Scenario('Changing canEditOwnProperty with system account permission', ({ Given, When, Then }) => {
    Given('a StaffRolePropertyPermissions entity with system account permission', () => {
      visa = makeVisa({ canManageStaffRolesAndPermissions: false, isSystemAccount: true });
      entity = new StaffRolePropertyPermissions(makeProps(), visa);
    });
    When('I set canEditOwnProperty to true', () => {
      entity.canEditOwnProperty = true;
    });
    Then('the property should be updated to true', () => {
      expect(entity.canEditOwnProperty).toBe(true);
    });
  });

  Scenario('Changing canEditOwnProperty without permission', ({ Given, When, Then }) => {
    let setWithoutPermission: () => void;
    Given('a StaffRolePropertyPermissions entity without permission to manage staff roles or system account', () => {
      visa = makeVisa({ canManageStaffRolesAndPermissions: false, isSystemAccount: false });
      entity = new StaffRolePropertyPermissions(makeProps(), visa);
    });
    When('I try to set canEditOwnProperty to true', () => {
      setWithoutPermission = () => {
        entity.canEditOwnProperty = true;
      };
    });
    Then('a PermissionError should be thrown', () => {
      expect(setWithoutPermission).toThrow(DomainSeedwork.PermissionError);
      expect(setWithoutPermission).toThrow('Cannot set permission');
    });
  });
});