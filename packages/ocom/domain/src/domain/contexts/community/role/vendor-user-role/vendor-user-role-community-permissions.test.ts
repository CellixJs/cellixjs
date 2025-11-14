import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import { VendorUserRoleCommunityPermissions } from './vendor-user-role-community-permissions.ts';
const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/vendor-user-role-community-permissions.feature'),
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
    canManageVendorUserRolesAndPermissions: false,
    canManageCommunitySettings: false,
    canManageSiteContent: false,
    canManageMembers: false,
    canEditOwnMemberProfile: false,
    canEditOwnMemberAccounts: false,
  };
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  let visa: ReturnType<typeof makeVisa>;
  let props: ReturnType<typeof makeProps>;
  let entity: VendorUserRoleCommunityPermissions;

  BeforeEachScenario(() => {
    visa = makeVisa();
    props = makeProps();
    entity = new VendorUserRoleCommunityPermissions(props, visa);
  });

  Background(({ Given, And }) => {
    Given('valid VendorUserRoleCommunityPermissionsProps with all permission flags set to false', () => {
      props = makeProps();
    });
    And('a valid CommunityVisa', () => {
      visa = makeVisa();
    });
  });

  // canManageVendorUserRolesAndPermissions
  Scenario('Changing canManageVendorUserRolesAndPermissions with manage vendor user roles permission', ({ Given, When, Then }) => {
    Given('an VendorUserRoleCommunityPermissions entity with permission to manage vendor user roles', () => {
      visa = makeVisa({ canManageVendorUserRolesAndPermissions: true });
      entity = new VendorUserRoleCommunityPermissions(makeProps(), visa);
    });
    When('I set canManageVendorUserRolesAndPermissions to true', () => {
      entity.canManageVendorUserRolesAndPermissions = true;
    });
    Then('the property should be updated to true', () => {
      expect(entity.canManageVendorUserRolesAndPermissions).toBe(true);
    });
  });

  Scenario('Changing canManageVendorUserRolesAndPermissions with system account permission', ({ Given, When, Then }) => {
    Given('an VendorUserRoleCommunityPermissions entity with system account permission', () => {
      visa = makeVisa({ canManageVendorUserRolesAndPermissions: false, isSystemAccount: true });
      entity = new VendorUserRoleCommunityPermissions(makeProps(), visa);
    });
    When('I set canManageVendorUserRolesAndPermissions to true', () => {
      entity.canManageVendorUserRolesAndPermissions = true;
    });
    Then('the property should be updated to true', () => {
      expect(entity.canManageVendorUserRolesAndPermissions).toBe(true);
    });
  });

  Scenario('Changing canManageVendorUserRolesAndPermissions without permission', ({ Given, When, Then }) => {
    let setPermission: () => void;
    Given('an VendorUserRoleCommunityPermissions entity without permission to manage vendor user roles or system account', () => {
      visa = makeVisa({ canManageVendorUserRolesAndPermissions: false, isSystemAccount: false });
      entity = new VendorUserRoleCommunityPermissions(makeProps(), visa);
    });
    When('I try to set canManageVendorUserRolesAndPermissions to true', () => {
      setPermission = () => {
        entity.canManageVendorUserRolesAndPermissions = true;
      };
    });
    Then('a PermissionError should be thrown', () => {
      expect(setPermission).toThrow(PermissionError);
      expect(setPermission).throws('Cannot set permission');
    });
  });

  // canManageCommunitySettings
  Scenario('Changing canManageCommunitySettings with manage vendor user roles permission', ({ Given, When, Then }) => {
    Given('an VendorUserRoleCommunityPermissions entity with permission to manage vendor user roles', () => {
      visa = makeVisa({ canManageVendorUserRolesAndPermissions: true });
      entity = new VendorUserRoleCommunityPermissions(makeProps(), visa);
    });
    When('I set canManageCommunitySettings to true', () => {
      entity.canManageCommunitySettings = true;
    });
    Then('the property should be updated to true', () => {
      expect(entity.canManageCommunitySettings).toBe(true);
    });
  });

  Scenario('Changing canManageCommunitySettings with system account permission', ({ Given, When, Then }) => {
    Given('an VendorUserRoleCommunityPermissions entity with system account permission', () => {
      visa = makeVisa({ canManageVendorUserRolesAndPermissions: false, isSystemAccount: true });
      entity = new VendorUserRoleCommunityPermissions(makeProps(), visa);
    });
    When('I set canManageCommunitySettings to true', () => {
      entity.canManageCommunitySettings = true;
    });
    Then('the property should be updated to true', () => {
      expect(entity.canManageCommunitySettings).toBe(true);
    });
  });

  Scenario('Changing canManageCommunitySettings without permission', ({ Given, When, Then }) => {
    let setPermission: () => void;
    Given('an VendorUserRoleCommunityPermissions entity without permission to manage vendor user roles or system account', () => {
      visa = makeVisa({ canManageVendorUserRolesAndPermissions: false, isSystemAccount: false });
      entity = new VendorUserRoleCommunityPermissions(makeProps(), visa);
    });
    When('I try to set canManageCommunitySettings to true', () => {
      setPermission = () => {
        entity.canManageCommunitySettings = true;
      };
    });
    Then('a PermissionError should be thrown', () => {
      expect(setPermission).toThrow(PermissionError);
      expect(setPermission).throws('Cannot set permission');
    });
  });

  // canManageSiteContent
  Scenario('Changing canManageSiteContent with manage vendor user roles permission', ({ Given, When, Then }) => {
    Given('an VendorUserRoleCommunityPermissions entity with permission to manage vendor user roles', () => {
      visa = makeVisa({ canManageVendorUserRolesAndPermissions: true });
      entity = new VendorUserRoleCommunityPermissions(makeProps(), visa);
    });
    When('I set canManageSiteContent to true', () => {
      entity.canManageSiteContent = true;
    });
    Then('the property should be updated to true', () => {
      expect(entity.canManageSiteContent).toBe(true);
    });
  });

  Scenario('Changing canManageSiteContent with system account permission', ({ Given, When, Then }) => {
    Given('an VendorUserRoleCommunityPermissions entity with system account permission', () => {
      visa = makeVisa({ canManageVendorUserRolesAndPermissions: false, isSystemAccount: true });
      entity = new VendorUserRoleCommunityPermissions(makeProps(), visa);
    });
    When('I set canManageSiteContent to true', () => {
      entity.canManageSiteContent = true;
    });
    Then('the property should be updated to true', () => {
      expect(entity.canManageSiteContent).toBe(true);
    });
  });

  Scenario('Changing canManageSiteContent without permission', ({ Given, When, Then }) => {
    let setPermission: () => void;
    Given('an VendorUserRoleCommunityPermissions entity without permission to manage vendor user roles or system account', () => {
      visa = makeVisa({ canManageVendorUserRolesAndPermissions: false, isSystemAccount: false });
      entity = new VendorUserRoleCommunityPermissions(makeProps(), visa);
    });
    When('I try to set canManageSiteContent to true', () => {
      setPermission = () => {
        entity.canManageSiteContent = true;
      };
    });
    Then('a PermissionError should be thrown', () => {
      expect(setPermission).toThrow(PermissionError);
      expect(setPermission).throws('Cannot set permission');
    });
  });

  // canManageMembers
  Scenario('Changing canManageMembers with manage vendor user roles permission', ({ Given, When, Then }) => {
    Given('an VendorUserRoleCommunityPermissions entity with permission to manage vendor user roles', () => {
      visa = makeVisa({ canManageVendorUserRolesAndPermissions: true });
      entity = new VendorUserRoleCommunityPermissions(makeProps(), visa);
    });
    When('I set canManageMembers to true', () => {
      entity.canManageMembers = true;
    });
    Then('the property should be updated to true', () => {
      expect(entity.canManageMembers).toBe(true);
    });
  });

  Scenario('Changing canManageMembers with system account permission', ({ Given, When, Then }) => {
    Given('an VendorUserRoleCommunityPermissions entity with system account permission', () => {
      visa = makeVisa({ canManageVendorUserRolesAndPermissions: false, isSystemAccount: true });
      entity = new VendorUserRoleCommunityPermissions(makeProps(), visa);
    });
    When('I set canManageMembers to true', () => {
      entity.canManageMembers = true;
    });
    Then('the property should be updated to true', () => {
      expect(entity.canManageMembers).toBe(true);
    });
  });

  Scenario('Changing canManageMembers without permission', ({ Given, When, Then }) => {
    let setPermission: () => void;
    Given('an VendorUserRoleCommunityPermissions entity without permission to manage vendor user roles or system account', () => {
      visa = makeVisa({ canManageVendorUserRolesAndPermissions: false, isSystemAccount: false });
      entity = new VendorUserRoleCommunityPermissions(makeProps(), visa);
    });
    When('I try to set canManageMembers to true', () => {
      setPermission = () => {
        entity.canManageMembers = true;
      };
    });
    Then('a PermissionError should be thrown', () => {
      expect(setPermission).toThrow(PermissionError);
      expect(setPermission).throws('Cannot set permission');
    });
  });

  // canEditOwnMemberProfile
  Scenario('Changing canEditOwnMemberProfile with manage vendor user roles permission', ({ Given, When, Then }) => {
    Given('an VendorUserRoleCommunityPermissions entity with permission to manage vendor user roles', () => {
      visa = makeVisa({ canManageVendorUserRolesAndPermissions: true });
      entity = new VendorUserRoleCommunityPermissions(makeProps(), visa);
    });
    When('I set canEditOwnMemberProfile to true', () => {
      entity.canEditOwnMemberProfile = true;
    });
    Then('the property should be updated to true', () => {
      expect(entity.canEditOwnMemberProfile).toBe(true);
    });
  });

  Scenario('Changing canEditOwnMemberProfile with system account permission', ({ Given, When, Then }) => {
    Given('an VendorUserRoleCommunityPermissions entity with system account permission', () => {
      visa = makeVisa({ canManageVendorUserRolesAndPermissions: false, isSystemAccount: true });
      entity = new VendorUserRoleCommunityPermissions(makeProps(), visa);
    });
    When('I set canEditOwnMemberProfile to true', () => {
      entity.canEditOwnMemberProfile = true;
    });
    Then('the property should be updated to true', () => {
      expect(entity.canEditOwnMemberProfile).toBe(true);
    });
  });

  Scenario('Changing canEditOwnMemberProfile without permission', ({ Given, When, Then }) => {
    let setPermission: () => void;
    Given('an VendorUserRoleCommunityPermissions entity without permission to manage vendor user roles or system account', () => {
      visa = makeVisa({ canManageVendorUserRolesAndPermissions: false, isSystemAccount: false });
      entity = new VendorUserRoleCommunityPermissions(makeProps(), visa);
    });
    When('I try to set canEditOwnMemberProfile to true', () => {
      setPermission = () => {
        entity.canEditOwnMemberProfile = true;
      };
    });
    Then('a PermissionError should be thrown', () => {
      expect(setPermission).toThrow(PermissionError);
      expect(setPermission).throws('Cannot set permission');
    });
  });

  // canEditOwnMemberAccounts
  Scenario('Changing canEditOwnMemberAccounts with manage vendor user roles permission', ({ Given, When, Then }) => {
    Given('an VendorUserRoleCommunityPermissions entity with permission to manage vendor user roles', () => {
      visa = makeVisa({ canManageVendorUserRolesAndPermissions: true });
      entity = new VendorUserRoleCommunityPermissions(makeProps(), visa);
    });
    When('I set canEditOwnMemberAccounts to true', () => {
      entity.canEditOwnMemberAccounts = true;
    });
    Then('the property should be updated to true', () => {
      expect(entity.canEditOwnMemberAccounts).toBe(true);
    });
  });

  Scenario('Changing canEditOwnMemberAccounts with system account permission', ({ Given, When, Then }) => {
    Given('an VendorUserRoleCommunityPermissions entity with system account permission', () => {
      visa = makeVisa({ canManageVendorUserRolesAndPermissions: false, isSystemAccount: true });
      entity = new VendorUserRoleCommunityPermissions(makeProps(), visa);
    });
    When('I set canEditOwnMemberAccounts to true', () => {
      entity.canEditOwnMemberAccounts = true;
    });
    Then('the property should be updated to true', () => {
      expect(entity.canEditOwnMemberAccounts).toBe(true);
    });
  });

  Scenario('Changing canEditOwnMemberAccounts without permission', ({ Given, When, Then }) => {
    let setPermission: () => void;
    Given('an VendorUserRoleCommunityPermissions entity without permission to manage vendor user roles or system account', () => {
      visa = makeVisa({ canManageVendorUserRolesAndPermissions: false, isSystemAccount: false });
      entity = new VendorUserRoleCommunityPermissions(makeProps(), visa);
    });
    When('I try to set canEditOwnMemberAccounts to true', () => {
      setPermission = () => {
        entity.canEditOwnMemberAccounts = true;
      };
    });
    Then('a PermissionError should be thrown', () => {
      expect(setPermission).toThrow(PermissionError);
      expect(setPermission).throws('Cannot set permission');
    });
  });
});