Feature: <Entity> EndUserRoleServicePermissions

  Background:
    Given valid EndUserRoleServicePermissionsProps with canManageServices set to false
    And a valid CommunityVisa

  Scenario: Changing canManageServices with manage end user roles permission
    Given an EndUserRoleServicePermissions entity with permission to manage end user roles
    When I set canManageServices to true
    Then the property should be updated to true

  Scenario: Changing canManageServices with system account permission
    Given an EndUserRoleServicePermissions entity with system account permission
    When I set canManageServices to true
    Then the property should be updated to true

  Scenario: Changing canManageServices without permission
    Given an EndUserRoleServicePermissions entity without permission to manage end user roles or system account
    When I try to set canManageServices to true
    Then a PermissionError should be thrown