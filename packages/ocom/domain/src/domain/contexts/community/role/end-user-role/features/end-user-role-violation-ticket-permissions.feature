Feature: <Entity> EndUserRoleViolationTicketPermissions

  Background:
    Given valid EndUserRoleViolationTicketPermissionsProps with all permissions set to false
    And a valid CommunityVisa

  Scenario: Changing canCreateTickets with manage end user roles permission
    Given an EndUserRoleViolationTicketPermissions entity with permission to manage end user roles
    When I set canCreateTickets to true
    Then the property should be updated to true

  Scenario: Changing canCreateTickets with system account permission
    Given an EndUserRoleViolationTicketPermissions entity with system account permission
    When I set canCreateTickets to true
    Then the property should be updated to true

  Scenario: Changing canCreateTickets without permission
    Given an EndUserRoleViolationTicketPermissions entity without permission to manage end user roles or system account
    When I try to set canCreateTickets to true
    Then a PermissionError should be thrown

  Scenario: Changing canManageTickets with manage end user roles permission
    Given an EndUserRoleViolationTicketPermissions entity with permission to manage end user roles
    When I set canManageTickets to true
    Then the property should be updated to true

  Scenario: Changing canManageTickets with system account permission
    Given an EndUserRoleViolationTicketPermissions entity with system account permission
    When I set canManageTickets to true
    Then the property should be updated to true

  Scenario: Changing canManageTickets without permission
    Given an EndUserRoleViolationTicketPermissions entity without permission to manage end user roles or system account
    When I try to set canManageTickets to true
    Then a PermissionError should be thrown

  Scenario: Changing canAssignTickets with manage end user roles permission
    Given an EndUserRoleViolationTicketPermissions entity with permission to manage end user roles
    When I set canAssignTickets to true
    Then the property should be updated to true

  Scenario: Changing canAssignTickets with system account permission
    Given an EndUserRoleViolationTicketPermissions entity with system account permission
    When I set canAssignTickets to true
    Then the property should be updated to true

  Scenario: Changing canAssignTickets without permission
    Given an EndUserRoleViolationTicketPermissions entity without permission to manage end user roles or system account
    When I try to set canAssignTickets to true
    Then a PermissionError should be thrown

  Scenario: Changing canWorkOnTickets with manage end user roles permission
    Given an EndUserRoleViolationTicketPermissions entity with permission to manage end user roles
    When I set canWorkOnTickets to true
    Then the property should be updated to true

  Scenario: Changing canWorkOnTickets with system account permission
    Given an EndUserRoleViolationTicketPermissions entity with system account permission
    When I set canWorkOnTickets to true
    Then the property should be updated to true

  Scenario: Changing canWorkOnTickets without permission
    Given an EndUserRoleViolationTicketPermissions entity without permission to manage end user roles or system account
    When I try to set canWorkOnTickets to true
    Then a PermissionError should be thrown
