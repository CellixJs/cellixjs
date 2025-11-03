Feature: Managing staff role service permissions

  Background:
    Given valid StaffRoleServicePermissionsProps with all permission flags set to false
    And a valid UserVisa

  # canManageServices
  Scenario: Changing canManageServices with manage staff roles permission
    Given a StaffRoleServicePermissions entity with permission to manage staff roles
    When I set canManageServices to true
    Then the property should be updated to true

  Scenario: Changing canManageServices with system account permission
    Given a StaffRoleServicePermissions entity with system account permission
    When I set canManageServices to true
    Then the property should be updated to true

  Scenario: Changing canManageServices without permission
    Given a StaffRoleServicePermissions entity without permission to manage staff roles or system account
    When I try to set canManageServices to true
    Then a PermissionError should be thrown