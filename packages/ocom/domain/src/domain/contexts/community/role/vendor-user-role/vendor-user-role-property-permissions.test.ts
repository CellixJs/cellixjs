import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import { VendorUserRolePropertyPermissions, type VendorUserRolePropertyPermissionsProps } from './vendor-user-role-property-permissions.ts';
import { DomainSeedwork } from '@cellix/domain-seedwork';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/vendor-user-role-property-permissions.feature'),
);

function makeVisa(overrides: Partial<{ canManageVendorUserRolesAndPermissions: boolean; isSystemAccount: boolean }> = {}) {
  return vi.mocked({
    determineIf: (fn: (p: { canManageVendorUserRolesAndPermissions: boolean; isSystemAccount: boolean }) => boolean) =>
      fn({
        canManageVendorUserRolesAndPermissions: overrides.canManageVendorUserRolesAndPermissions ?? true,
        isSystemAccount: overrides.isSystemAccount ?? false,
      }),
  });
}

function makeProps() {
  return {
    canManageProperties: false,
    canEditOwnProperty: false,
  } as VendorUserRolePropertyPermissionsProps;
}

describeFeature(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  let visa: ReturnType<typeof makeVisa>;
  let props: ReturnType<typeof makeProps>;
  let entity: VendorUserRolePropertyPermissions;

  BeforeEachScenario(() => {
    visa = makeVisa();
    props = makeProps();
    entity = new VendorUserRolePropertyPermissions(props, visa);
  });

  Background(({ Given, And }) => {
    Given('valid VendorUserRolePropertyPermissionsProps with canManageProperties and canEditOwnProperty set to false', () => {
      props = makeProps();
    });
    And('a valid CommunityVisa', () => {
      visa = makeVisa();
    });
  });

  // canManageProperties
  Scenario('Changing canManageProperties with manage vendor user roles permission', ({ Given, When, Then }) => {
    Given('an VendorUserRolePropertyPermissions entity with permission to manage vendor user roles', () => {
      visa = makeVisa({ canManageVendorUserRolesAndPermissions: true });
      entity = new VendorUserRolePropertyPermissions(makeProps(), visa);
    });
    When('I set canManageProperties to true', () => {
      entity.canManageProperties = true;
    });
    Then('the property should be updated to true', () => {
      expect(entity.canManageProperties).toBe(true);
    });
  });

  Scenario('Changing canManageProperties with system account permission', ({ Given, When, Then }) => {
    Given('an VendorUserRolePropertyPermissions entity with system account permission', () => {
      visa = makeVisa({ canManageVendorUserRolesAndPermissions: false, isSystemAccount: true });
      entity = new VendorUserRolePropertyPermissions(makeProps(), visa);
    });
    When('I set canManageProperties to true', () => {
      entity.canManageProperties = true;
    });
    Then('the property should be updated to true', () => {
      expect(entity.canManageProperties).toBe(true);
    });
  });

  Scenario('Changing canManageProperties without permission', ({ Given, When, Then }) => {
    let setPermission: () => void;
    Given('an VendorUserRolePropertyPermissions entity without permission to manage vendor user roles or system account', () => {
      visa = makeVisa({ canManageVendorUserRolesAndPermissions: false, isSystemAccount: false });
      entity = new VendorUserRolePropertyPermissions(makeProps(), visa);
    });
    When('I try to set canManageProperties to true', () => {
      setPermission = () => {
        entity.canManageProperties = true;
      };
    });
    Then('a PermissionError should be thrown', () => {
      expect(setPermission).toThrow(DomainSeedwork.PermissionError);
      expect(setPermission).throws('Cannot set permission');
    });
  });

  // canEditOwnProperty
  Scenario('Changing canEditOwnProperty with manage vendor user roles permission', ({ Given, When, Then }) => {
    Given('an VendorUserRolePropertyPermissions entity with permission to manage vendor user roles', () => {
      visa = makeVisa({ canManageVendorUserRolesAndPermissions: true });
      entity = new VendorUserRolePropertyPermissions(makeProps(), visa);
    });
    When('I set canEditOwnProperty to true', () => {
      entity.canEditOwnProperty = true;
    });
    Then('the property should be updated to true', () => {
      expect(entity.canEditOwnProperty).toBe(true);
    });
  });

  Scenario('Changing canEditOwnProperty with system account permission', ({ Given, When, Then }) => {
    Given('an VendorUserRolePropertyPermissions entity with system account permission', () => {
      visa = makeVisa({ canManageVendorUserRolesAndPermissions: false, isSystemAccount: true });
      entity = new VendorUserRolePropertyPermissions(makeProps(), visa);
    });
    When('I set canEditOwnProperty to true', () => {
      entity.canEditOwnProperty = true;
    });
    Then('the property should be updated to true', () => {
      expect(entity.canEditOwnProperty).toBe(true);
    });
  });

  Scenario('Changing canEditOwnProperty without permission', ({ Given, When, Then }) => {
    let setPermission: () => void;
    Given('an VendorUserRolePropertyPermissions entity without permission to manage vendor user roles or system account', () => {
      visa = makeVisa({ canManageVendorUserRolesAndPermissions: false, isSystemAccount: false });
      entity = new VendorUserRolePropertyPermissions(makeProps(), visa);
    });
    When('I try to set canEditOwnProperty to true', () => {
      setPermission = () => {
        entity.canEditOwnProperty = true;
      };
    });
    Then('a PermissionError should be thrown', () => {
      expect(setPermission).toThrow(DomainSeedwork.PermissionError);
      expect(setPermission).throws('Cannot set permission');
    });
  });
});