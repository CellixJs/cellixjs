Feature: <Entity> VendorUserRoleServicePermissions

  Background:
    Given valid VendorUserRoleServicePermissionsProps with canManageServices set to false
    And a valid CommunityVisa

  Scenario: Changing canManageServices with manage vendor user roles permission
    Given an VendorUserRoleServicePermissions entity with permission to manage vendor user roles
    When I set canManageServices to true
    Then the property should be updated to true

  Scenario: Changing canManageServices with system account permission
    Given an VendorUserRoleServicePermissions entity with system account permission
    When I set canManageServices to true
    Then the property should be updated to true

  Scenario: Changing canManageServices without permission
    Given an VendorUserRoleServicePermissions entity without permission to manage vendor user roles or system account
    When I try to set canManageServices to true
    Then a PermissionError should be thrown