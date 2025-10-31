Feature: Managing staff role violation ticket permissions

  Background:
    Given valid StaffRoleViolationTicketPermissionsProps with all permission flags set to false
    And a valid UserVisa

  # canCreateTickets
  Scenario: Changing canCreateTickets with manage staff roles permission
    Given a StaffRoleViolationTicketPermissions entity with permission to manage staff roles
    When I set canCreateTickets to true
    Then the property should be updated to true

  Scenario: Changing canCreateTickets with system account permission
    Given a StaffRoleViolationTicketPermissions entity with system account permission
    When I set canCreateTickets to true
    Then the property should be updated to true

  Scenario: Changing canCreateTickets without permission
    Given a StaffRoleViolationTicketPermissions entity without permission to manage staff roles or system account
    When I try to set canCreateTickets to true
    Then a PermissionError should be thrown

  # canManageTickets
  Scenario: Changing canManageTickets with manage staff roles permission
    Given a StaffRoleViolationTicketPermissions entity with permission to manage staff roles
    When I set canManageTickets to true
    Then the property should be updated to true

  Scenario: Changing canManageTickets with system account permission
    Given a StaffRoleViolationTicketPermissions entity with system account permission
    When I set canManageTickets to true
    Then the property should be updated to true

  Scenario: Changing canManageTickets without permission
    Given a StaffRoleViolationTicketPermissions entity without permission to manage staff roles or system account
    When I try to set canManageTickets to true
    Then a PermissionError should be thrown

  # canAssignTickets
  Scenario: Changing canAssignTickets with manage staff roles permission
    Given a StaffRoleViolationTicketPermissions entity with permission to manage staff roles
    When I set canAssignTickets to true
    Then the property should be updated to true

  Scenario: Changing canAssignTickets with system account permission
    Given a StaffRoleViolationTicketPermissions entity with system account permission
    When I set canAssignTickets to true
    Then the property should be updated to true

  Scenario: Changing canAssignTickets without permission
    Given a StaffRoleViolationTicketPermissions entity without permission to manage staff roles or system account
    When I try to set canAssignTickets to true
    Then a PermissionError should be thrown

  # canWorkOnTickets
  Scenario: Changing canWorkOnTickets with manage staff roles permission
    Given a StaffRoleViolationTicketPermissions entity with permission to manage staff roles
    When I set canWorkOnTickets to true
    Then the property should be updated to true

  Scenario: Changing canWorkOnTickets with system account permission
    Given a StaffRoleViolationTicketPermissions entity with system account permission
    When I set canWorkOnTickets to true
    Then the property should be updated to true

  Scenario: Changing canWorkOnTickets without permission
    Given a StaffRoleViolationTicketPermissions entity without permission to manage staff roles or system account
    When I try to set canWorkOnTickets to true
    Then a PermissionError should be thrown
