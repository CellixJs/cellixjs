import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import { EndUserRoleCommunityPermissions } from './end-user-role-community-permissions.ts';
import { DomainSeedwork } from '@cellix/domain-seedwork';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/end-user-role-community-permissions.feature'),
);

function makeVisa(overrides: Partial<{ canManageEndUserRolesAndPermissions: boolean; isSystemAccount: boolean }> = {}) {
  return vi.mocked({
    determineIf: (fn: (p: { canManageEndUserRolesAndPermissions: boolean; isSystemAccount: boolean }) => boolean) =>
      fn({
        canManageEndUserRolesAndPermissions: overrides.canManageEndUserRolesAndPermissions ?? true,
        isSystemAccount: overrides.isSystemAccount ?? false,
      }),
  });
}

function makeProps() {
  return {
    canManageEndUserRolesAndPermissions: false,
    canManageVendorUserRolesAndPermissions: false,
    canManageCommunitySettings: false,
    canManageSiteContent: false,
    canManageMembers: false,
    canEditOwnMemberProfile: false,
    canEditOwnMemberAccounts: false,
  };
}

describeFeature(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  let visa: ReturnType<typeof makeVisa>;
  let props: ReturnType<typeof makeProps>;
  let entity: EndUserRoleCommunityPermissions;

  BeforeEachScenario(() => {
    visa = makeVisa();
    props = makeProps();
    entity = new EndUserRoleCommunityPermissions(props, visa);
  });

  Background(({ Given, And }) => {
    Given('valid EndUserRoleCommunityPermissionsProps with all permission flags set to false', () => {
      props = makeProps();
    });
    And('a valid CommunityVisa', () => {
      visa = makeVisa();
    });
  });

  // canManageEndUserRolesAndPermissions
  Scenario('Changing canManageEndUserRolesAndPermissions with manage end user roles permission', ({ Given, When, Then }) => {
    Given('an EndUserRoleCommunityPermissions entity with permission to manage end user roles', () => {
      visa = makeVisa({ canManageEndUserRolesAndPermissions: true });
      entity = new EndUserRoleCommunityPermissions(makeProps(), visa);
    });
    When('I set canManageEndUserRolesAndPermissions to true', () => {
      entity.canManageEndUserRolesAndPermissions = true;
    });
    Then('the property should be updated to true', () => {
      expect(entity.canManageEndUserRolesAndPermissions).toBe(true);
    });
  });

  Scenario('Changing canManageEndUserRolesAndPermissions with system account permission', ({ Given, When, Then }) => {
    Given('an EndUserRoleCommunityPermissions entity with system account permission', () => {
      visa = makeVisa({ canManageEndUserRolesAndPermissions: false, isSystemAccount: true });
      entity = new EndUserRoleCommunityPermissions(makeProps(), visa);
    });
    When('I set canManageEndUserRolesAndPermissions to true', () => {
      entity.canManageEndUserRolesAndPermissions = true;
    });
    Then('the property should be updated to true', () => {
      expect(entity.canManageEndUserRolesAndPermissions).toBe(true);
    });
  });

  Scenario('Changing canManageEndUserRolesAndPermissions without permission', ({ Given, When, Then }) => {
    let setPermission: () => void;
    Given('an EndUserRoleCommunityPermissions entity without permission to manage end user roles or system account', () => {
      visa = makeVisa({ canManageEndUserRolesAndPermissions: false, isSystemAccount: false });
      entity = new EndUserRoleCommunityPermissions(makeProps(), visa);
    });
    When('I try to set canManageEndUserRolesAndPermissions to true', () => {
      setPermission = () => {
        entity.canManageEndUserRolesAndPermissions = true;
      };
    });
    Then('a PermissionError should be thrown', () => {
      expect(setPermission).toThrow(DomainSeedwork.PermissionError);
      expect(setPermission).throws('Cannot set permission1');
    });
  });

  // canManageCommunitySettings
  Scenario('Changing canManageCommunitySettings with manage end user roles permission', ({ Given, When, Then }) => {
    Given('an EndUserRoleCommunityPermissions entity with permission to manage end user roles', () => {
      visa = makeVisa({ canManageEndUserRolesAndPermissions: true });
      entity = new EndUserRoleCommunityPermissions(makeProps(), visa);
    });
    When('I set canManageCommunitySettings to true', () => {
      entity.canManageCommunitySettings = true;
    });
    Then('the property should be updated to true', () => {
      expect(entity.canManageCommunitySettings).toBe(true);
    });
  });

  Scenario('Changing canManageCommunitySettings with system account permission', ({ Given, When, Then }) => {
    Given('an EndUserRoleCommunityPermissions entity with system account permission', () => {
      visa = makeVisa({ canManageEndUserRolesAndPermissions: false, isSystemAccount: true });
      entity = new EndUserRoleCommunityPermissions(makeProps(), visa);
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
    Given('an EndUserRoleCommunityPermissions entity without permission to manage end user roles or system account', () => {
      visa = makeVisa({ canManageEndUserRolesAndPermissions: false, isSystemAccount: false });
      entity = new EndUserRoleCommunityPermissions(makeProps(), visa);
    });
    When('I try to set canManageCommunitySettings to true', () => {
      setPermission = () => {
        entity.canManageCommunitySettings = true;
      };
    });
    Then('a PermissionError should be thrown', () => {
      expect(setPermission).toThrow(DomainSeedwork.PermissionError);
      expect(setPermission).throws('Cannot set permission2');
    });
  });

  // canManageSiteContent
  Scenario('Changing canManageSiteContent with manage end user roles permission', ({ Given, When, Then }) => {
    Given('an EndUserRoleCommunityPermissions entity with permission to manage end user roles', () => {
      visa = makeVisa({ canManageEndUserRolesAndPermissions: true });
      entity = new EndUserRoleCommunityPermissions(makeProps(), visa);
    });
    When('I set canManageSiteContent to true', () => {
      entity.canManageSiteContent = true;
    });
    Then('the property should be updated to true', () => {
      expect(entity.canManageSiteContent).toBe(true);
    });
  });

  Scenario('Changing canManageSiteContent with system account permission', ({ Given, When, Then }) => {
    Given('an EndUserRoleCommunityPermissions entity with system account permission', () => {
      visa = makeVisa({ canManageEndUserRolesAndPermissions: false, isSystemAccount: true });
      entity = new EndUserRoleCommunityPermissions(makeProps(), visa);
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
    Given('an EndUserRoleCommunityPermissions entity without permission to manage end user roles or system account', () => {
      visa = makeVisa({ canManageEndUserRolesAndPermissions: false, isSystemAccount: false });
      entity = new EndUserRoleCommunityPermissions(makeProps(), visa);
    });
    When('I try to set canManageSiteContent to true', () => {
      setPermission = () => {
        entity.canManageSiteContent = true;
      };
    });
    Then('a PermissionError should be thrown', () => {
      expect(setPermission).toThrow(DomainSeedwork.PermissionError);
      expect(setPermission).throws('Cannot set permission');
    });
  });

  // canManageMembers
  Scenario('Changing canManageMembers with manage end user roles permission', ({ Given, When, Then }) => {
    Given('an EndUserRoleCommunityPermissions entity with permission to manage end user roles', () => {
      visa = makeVisa({ canManageEndUserRolesAndPermissions: true });
      entity = new EndUserRoleCommunityPermissions(makeProps(), visa);
    });
    When('I set canManageMembers to true', () => {
      entity.canManageMembers = true;
    });
    Then('the property should be updated to true', () => {
      expect(entity.canManageMembers).toBe(true);
    });
  });

  Scenario('Changing canManageMembers with system account permission', ({ Given, When, Then }) => {
    Given('an EndUserRoleCommunityPermissions entity with system account permission', () => {
      visa = makeVisa({ canManageEndUserRolesAndPermissions: false, isSystemAccount: true });
      entity = new EndUserRoleCommunityPermissions(makeProps(), visa);
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
    Given('an EndUserRoleCommunityPermissions entity without permission to manage end user roles or system account', () => {
      visa = makeVisa({ canManageEndUserRolesAndPermissions: false, isSystemAccount: false });
      entity = new EndUserRoleCommunityPermissions(makeProps(), visa);
    });
    When('I try to set canManageMembers to true', () => {
      setPermission = () => {
        entity.canManageMembers = true;
      };
    });
    Then('a PermissionError should be thrown', () => {
      expect(setPermission).toThrow(DomainSeedwork.PermissionError);
      expect(setPermission).throws('Cannot set permission');
    });
  });

  // canEditOwnMemberProfile
  Scenario('Changing canEditOwnMemberProfile with manage end user roles permission', ({ Given, When, Then }) => {
    Given('an EndUserRoleCommunityPermissions entity with permission to manage end user roles', () => {
      visa = makeVisa({ canManageEndUserRolesAndPermissions: true });
      entity = new EndUserRoleCommunityPermissions(makeProps(), visa);
    });
    When('I set canEditOwnMemberProfile to true', () => {
      entity.canEditOwnMemberProfile = true;
    });
    Then('the property should be updated to true', () => {
      expect(entity.canEditOwnMemberProfile).toBe(true);
    });
  });

  Scenario('Changing canEditOwnMemberProfile with system account permission', ({ Given, When, Then }) => {
    Given('an EndUserRoleCommunityPermissions entity with system account permission', () => {
      visa = makeVisa({ canManageEndUserRolesAndPermissions: false, isSystemAccount: true });
      entity = new EndUserRoleCommunityPermissions(makeProps(), visa);
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
    Given('an EndUserRoleCommunityPermissions entity without permission to manage end user roles or system account', () => {
      visa = makeVisa({ canManageEndUserRolesAndPermissions: false, isSystemAccount: false });
      entity = new EndUserRoleCommunityPermissions(makeProps(), visa);
    });
    When('I try to set canEditOwnMemberProfile to true', () => {
      setPermission = () => {
        entity.canEditOwnMemberProfile = true;
      };
    });
    Then('a PermissionError should be thrown', () => {
      expect(setPermission).toThrow(DomainSeedwork.PermissionError);
      expect(setPermission).throws('Cannot set permission');
    });
  });

  // canEditOwnMemberAccounts
  Scenario('Changing canEditOwnMemberAccounts with manage end user roles permission', ({ Given, When, Then }) => {
    Given('an EndUserRoleCommunityPermissions entity with permission to manage end user roles', () => {
      visa = makeVisa({ canManageEndUserRolesAndPermissions: true });
      entity = new EndUserRoleCommunityPermissions(makeProps(), visa);
    });
    When('I set canEditOwnMemberAccounts to true', () => {
      entity.canEditOwnMemberAccounts = true;
    });
    Then('the property should be updated to true', () => {
      expect(entity.canEditOwnMemberAccounts).toBe(true);
    });
  });

  Scenario('Changing canEditOwnMemberAccounts with system account permission', ({ Given, When, Then }) => {
    Given('an EndUserRoleCommunityPermissions entity with system account permission', () => {
      visa = makeVisa({ canManageEndUserRolesAndPermissions: false, isSystemAccount: true });
      entity = new EndUserRoleCommunityPermissions(makeProps(), visa);
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
    Given('an EndUserRoleCommunityPermissions entity without permission to manage end user roles or system account', () => {
      visa = makeVisa({ canManageEndUserRolesAndPermissions: false, isSystemAccount: false });
      entity = new EndUserRoleCommunityPermissions(makeProps(), visa);
    });
    When('I try to set canEditOwnMemberAccounts to true', () => {
      setPermission = () => {
        entity.canEditOwnMemberAccounts = true;
      };
    });
    Then('a PermissionError should be thrown', () => {
      expect(setPermission).toThrow(DomainSeedwork.PermissionError);
      expect(setPermission).throws('Cannot set permission');
    });
  });
});