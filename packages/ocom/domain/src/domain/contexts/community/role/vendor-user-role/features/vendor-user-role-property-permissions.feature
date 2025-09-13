Feature: <Entity> VendorUserRolePropertyPermissions

  Background:
    Given valid VendorUserRolePropertyPermissionsProps with canManageProperties and canEditOwnProperty set to false
    And a valid CommunityVisa

  Scenario: Changing canManageProperties with manage vendor user roles permission
    Given an VendorUserRolePropertyPermissions entity with permission to manage vendor user roles
    When I set canManageProperties to true
    Then the property should be updated to true

  Scenario: Changing canManageProperties with system account permission
    Given an VendorUserRolePropertyPermissions entity with system account permission
    When I set canManageProperties to true
    Then the property should be updated to true

  Scenario: Changing canManageProperties without permission
    Given an VendorUserRolePropertyPermissions entity without permission to manage vendor user roles or system account
    When I try to set canManageProperties to true
    Then a PermissionError should be thrown

  Scenario: Changing canEditOwnProperty with manage vendor user roles permission
    Given an VendorUserRolePropertyPermissions entity with permission to manage vendor user roles
    When I set canEditOwnProperty to true
    Then the property should be updated to true

  Scenario: Changing canEditOwnProperty with system account permission
    Given an VendorUserRolePropertyPermissions entity with system account permission
    When I set canEditOwnProperty to true
    Then the property should be updated to true

  Scenario: Changing canEditOwnProperty without permission
    Given an VendorUserRolePropertyPermissions entity without permission to manage vendor user roles or system account
    When I try to set canEditOwnProperty to true
    Then a PermissionError should be thrown