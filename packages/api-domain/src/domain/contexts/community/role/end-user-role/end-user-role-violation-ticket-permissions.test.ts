import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import { EndUserRoleViolationTicketPermissions } from './end-user-role-violation-ticket-permissions.ts';
import { DomainSeedwork } from '@cellix/domain-seedwork';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/end-user-role-violation-ticket-permissions.feature'),
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
    canCreateTickets: false,
    canManageTickets: false,
    canAssignTickets: false,
    canWorkOnTickets: false,
  };
}

describeFeature(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  let visa: ReturnType<typeof makeVisa>;
  let props: ReturnType<typeof makeProps>;
  let entity: EndUserRoleViolationTicketPermissions;

  BeforeEachScenario(() => {
    visa = makeVisa();
    props = makeProps();
    entity = new EndUserRoleViolationTicketPermissions(props, visa);
  });

  Background(({ Given, And }) => {
    Given('valid EndUserRoleViolationTicketPermissionsProps with all permissions set to false', () => {
      props = makeProps();
    });
    And('a valid CommunityVisa', () => {
      visa = makeVisa();
    });
  });

  // canCreateTickets
  Scenario('Changing canCreateTickets with manage end user roles permission', ({ Given, When, Then }) => {
    Given('an EndUserRoleViolationTicketPermissions entity with permission to manage end user roles', () => {
      visa = makeVisa({ canManageEndUserRolesAndPermissions: true });
      entity = new EndUserRoleViolationTicketPermissions(makeProps(), visa);
    });
    When('I set canCreateTickets to true', () => {
      entity.canCreateTickets = true;
    });
    Then('the property should be updated to true', () => {
      expect(entity.canCreateTickets).toBe(true);
    });
  });

  Scenario('Changing canCreateTickets with system account permission', ({ Given, When, Then }) => {
    Given('an EndUserRoleViolationTicketPermissions entity with system account permission', () => {
      visa = makeVisa({ canManageEndUserRolesAndPermissions: false, isSystemAccount: true });
      entity = new EndUserRoleViolationTicketPermissions(makeProps(), visa);
    });
    When('I set canCreateTickets to true', () => {
      entity.canCreateTickets = true;
    });
    Then('the property should be updated to true', () => {
      expect(entity.canCreateTickets).toBe(true);
    });
  });

  Scenario('Changing canCreateTickets without permission', ({ Given, When, Then }) => {
    let setPermission: () => void;
    Given('an EndUserRoleViolationTicketPermissions entity without permission to manage end user roles or system account', () => {
      visa = makeVisa({ canManageEndUserRolesAndPermissions: false, isSystemAccount: false });
      entity = new EndUserRoleViolationTicketPermissions(makeProps(), visa);
    });
    When('I try to set canCreateTickets to true', () => {
      setPermission = () => {
        entity.canCreateTickets = true;
      };
    });
    Then('a PermissionError should be thrown', () => {
      expect(setPermission).toThrow(DomainSeedwork.PermissionError);
      expect(setPermission).toThrow('Cannot set permission');
    });
  });

  // canManageTickets
  Scenario('Changing canManageTickets with manage end user roles permission', ({ Given, When, Then }) => {
    Given('an EndUserRoleViolationTicketPermissions entity with permission to manage end user roles', () => {
      visa = makeVisa({ canManageEndUserRolesAndPermissions: true });
      entity = new EndUserRoleViolationTicketPermissions(makeProps(), visa);
    });
    When('I set canManageTickets to true', () => {
      entity.canManageTickets = true;
    });
    Then('the property should be updated to true', () => {
      expect(entity.canManageTickets).toBe(true);
    });
  });

  Scenario('Changing canManageTickets with system account permission', ({ Given, When, Then }) => {
    Given('an EndUserRoleViolationTicketPermissions entity with system account permission', () => {
      visa = makeVisa({ canManageEndUserRolesAndPermissions: false, isSystemAccount: true });
      entity = new EndUserRoleViolationTicketPermissions(makeProps(), visa);
    });
    When('I set canManageTickets to true', () => {
      entity.canManageTickets = true;
    });
    Then('the property should be updated to true', () => {
      expect(entity.canManageTickets).toBe(true);
    });
  });

  Scenario('Changing canManageTickets without permission', ({ Given, When, Then }) => {
    let setPermission: () => void;
    Given('an EndUserRoleViolationTicketPermissions entity without permission to manage end user roles or system account', () => {
      visa = makeVisa({ canManageEndUserRolesAndPermissions: false, isSystemAccount: false });
      entity = new EndUserRoleViolationTicketPermissions(makeProps(), visa);
    });
    When('I try to set canManageTickets to true', () => {
      setPermission = () => {
        entity.canManageTickets = true;
      };
    });
    Then('a PermissionError should be thrown', () => {
      expect(setPermission).toThrow(DomainSeedwork.PermissionError);
      expect(setPermission).toThrow('Cannot set permission');
    });
  });

  // canAssignTickets
  Scenario('Changing canAssignTickets with manage end user roles permission', ({ Given, When, Then }) => {
    Given('an EndUserRoleViolationTicketPermissions entity with permission to manage end user roles', () => {
      visa = makeVisa({ canManageEndUserRolesAndPermissions: true });
      entity = new EndUserRoleViolationTicketPermissions(makeProps(), visa);
    });
    When('I set canAssignTickets to true', () => {
      entity.canAssignTickets = true;
    });
    Then('the property should be updated to true', () => {
      expect(entity.canAssignTickets).toBe(true);
    });
  });

  Scenario('Changing canAssignTickets with system account permission', ({ Given, When, Then }) => {
    Given('an EndUserRoleViolationTicketPermissions entity with system account permission', () => {
      visa = makeVisa({ canManageEndUserRolesAndPermissions: false, isSystemAccount: true });
      entity = new EndUserRoleViolationTicketPermissions(makeProps(), visa);
    });
    When('I set canAssignTickets to true', () => {
      entity.canAssignTickets = true;
    });
    Then('the property should be updated to true', () => {
      expect(entity.canAssignTickets).toBe(true);
    });
  });

  Scenario('Changing canAssignTickets without permission', ({ Given, When, Then }) => {
    let setPermission: () => void;
    Given('an EndUserRoleViolationTicketPermissions entity without permission to manage end user roles or system account', () => {
      visa = makeVisa({ canManageEndUserRolesAndPermissions: false, isSystemAccount: false });
      entity = new EndUserRoleViolationTicketPermissions(makeProps(), visa);
    });
    When('I try to set canAssignTickets to true', () => {
      setPermission = () => {
        entity.canAssignTickets = true;
      };
    });
    Then('a PermissionError should be thrown', () => {
      expect(setPermission).toThrow(DomainSeedwork.PermissionError);
      expect(setPermission).toThrow('Cannot set permission');
    });
  });

  // canWorkOnTickets
  Scenario('Changing canWorkOnTickets with manage end user roles permission', ({ Given, When, Then }) => {
    Given('an EndUserRoleViolationTicketPermissions entity with permission to manage end user roles', () => {
      visa = makeVisa({ canManageEndUserRolesAndPermissions: true });
      entity = new EndUserRoleViolationTicketPermissions(makeProps(), visa);
    });
    When('I set canWorkOnTickets to true', () => {
      entity.canWorkOnTickets = true;
    });
    Then('the property should be updated to true', () => {
      expect(entity.canWorkOnTickets).toBe(true);
    });
  });

  Scenario('Changing canWorkOnTickets with system account permission', ({ Given, When, Then }) => {
    Given('an EndUserRoleViolationTicketPermissions entity with system account permission', () => {
      visa = makeVisa({ canManageEndUserRolesAndPermissions: false, isSystemAccount: true });
      entity = new EndUserRoleViolationTicketPermissions(makeProps(), visa);
    });
    When('I set canWorkOnTickets to true', () => {
      entity.canWorkOnTickets = true;
    });
    Then('the property should be updated to true', () => {
      expect(entity.canWorkOnTickets).toBe(true);
    });
  });

  Scenario('Changing canWorkOnTickets without permission', ({ Given, When, Then }) => {
    let setPermission: () => void;
    Given('an EndUserRoleViolationTicketPermissions entity without permission to manage end user roles or system account', () => {
      visa = makeVisa({ canManageEndUserRolesAndPermissions: false, isSystemAccount: false });
      entity = new EndUserRoleViolationTicketPermissions(makeProps(), visa);
    });
    When('I try to set canWorkOnTickets to true', () => {
      setPermission = () => {
        entity.canWorkOnTickets = true;
      };
    });
    Then('a PermissionError should be thrown', () => {
      expect(setPermission).toThrow(DomainSeedwork.PermissionError);
      expect(setPermission).toThrow('Cannot set permission');
    });
  });
});