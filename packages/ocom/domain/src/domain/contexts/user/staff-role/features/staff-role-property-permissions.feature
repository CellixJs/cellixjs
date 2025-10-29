Feature: Managing staff role property permissions

  Background:
    Given valid StaffRolePropertyPermissionsProps with all permission flags set to false
    And a valid UserVisa

  # canManageProperties
  Scenario: Changing canManageProperties with manage staff roles permission
    Given a StaffRolePropertyPermissions entity with permission to manage staff roles
    When I set canManageProperties to true
    Then the property should be updated to true

  Scenario: Changing canManageProperties with system account permission
    Given a StaffRolePropertyPermissions entity with system account permission
    When I set canManageProperties to true
    Then the property should be updated to true

  Scenario: Changing canManageProperties without permission
    Given a StaffRolePropertyPermissions entity without permission to manage staff roles or system account
    When I try to set canManageProperties to true
    Then a PermissionError should be thrown

  # canEditOwnProperty
  Scenario: Changing canEditOwnProperty with manage staff roles permission
    Given a StaffRolePropertyPermissions entity with permission to manage staff roles
    When I set canEditOwnProperty to true
    Then the property should be updated to true

  Scenario: Changing canEditOwnProperty with system account permission
    Given a StaffRolePropertyPermissions entity with system account permission
    When I set canEditOwnProperty to true
    Then the property should be updated to true

  Scenario: Changing canEditOwnProperty without permission
    Given a StaffRolePropertyPermissions entity without permission to manage staff roles or system account
    When I try to set canEditOwnProperty to true
    Then a PermissionError should be thrown