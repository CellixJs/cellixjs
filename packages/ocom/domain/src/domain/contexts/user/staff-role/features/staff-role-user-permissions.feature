Feature: <Entity> StaffRoleUserPermissions

  Background:
    Given valid StaffRoleUserPermissionsProps with all permission flags set to false
    And a valid UserVisa

  Scenario: Changing canManageUsers with manage staff roles permission
    Given a StaffRoleUserPermissions entity with permission to manage staff roles
    When I set canManageUsers to true
    Then the property should be updated to true

  Scenario: Changing canManageUsers with system account permission
    Given a StaffRoleUserPermissions entity with system account permission
    When I set canManageUsers to true
    Then the property should be updated to true

  Scenario: Changing canManageUsers without permission
    Given a StaffRoleUserPermissions entity without permission to manage staff roles or system account
    When I try to set canManageUsers to true
    Then a PermissionError should be thrown
