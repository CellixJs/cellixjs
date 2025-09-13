Feature: <Entity> EndUserRoleCommunityPermissions

  Background:
    Given valid EndUserRoleCommunityPermissionsProps with all permission flags set to false
    And a valid CommunityVisa

  Scenario: Changing canManageEndUserRolesAndPermissions with manage end user roles permission
    Given an EndUserRoleCommunityPermissions entity with permission to manage end user roles
    When I set canManageEndUserRolesAndPermissions to true
    Then the property should be updated to true

  Scenario: Changing canManageEndUserRolesAndPermissions with system account permission
    Given an EndUserRoleCommunityPermissions entity with system account permission
    When I set canManageEndUserRolesAndPermissions to true
    Then the property should be updated to true

  Scenario: Changing canManageEndUserRolesAndPermissions without permission
    Given an EndUserRoleCommunityPermissions entity without permission to manage end user roles or system account
    When I try to set canManageEndUserRolesAndPermissions to true
    Then a PermissionError should be thrown

  Scenario: Changing canManageCommunitySettings with manage end user roles permission
    Given an EndUserRoleCommunityPermissions entity with permission to manage end user roles
    When I set canManageCommunitySettings to true
    Then the property should be updated to true

  Scenario: Changing canManageCommunitySettings with system account permission
    Given an EndUserRoleCommunityPermissions entity with system account permission
    When I set canManageCommunitySettings to true
    Then the property should be updated to true

  Scenario: Changing canManageCommunitySettings without permission
    Given an EndUserRoleCommunityPermissions entity without permission to manage end user roles or system account
    When I try to set canManageCommunitySettings to true
    Then a PermissionError should be thrown

  Scenario: Changing canManageSiteContent with manage end user roles permission
    Given an EndUserRoleCommunityPermissions entity with permission to manage end user roles
    When I set canManageSiteContent to true
    Then the property should be updated to true

  Scenario: Changing canManageSiteContent with system account permission
    Given an EndUserRoleCommunityPermissions entity with system account permission
    When I set canManageSiteContent to true
    Then the property should be updated to true

  Scenario: Changing canManageSiteContent without permission
    Given an EndUserRoleCommunityPermissions entity without permission to manage end user roles or system account
    When I try to set canManageSiteContent to true
    Then a PermissionError should be thrown

  Scenario: Changing canManageMembers with manage end user roles permission
    Given an EndUserRoleCommunityPermissions entity with permission to manage end user roles
    When I set canManageMembers to true
    Then the property should be updated to true

  Scenario: Changing canManageMembers with system account permission
    Given an EndUserRoleCommunityPermissions entity with system account permission
    When I set canManageMembers to true
    Then the property should be updated to true

  Scenario: Changing canManageMembers without permission
    Given an EndUserRoleCommunityPermissions entity without permission to manage end user roles or system account
    When I try to set canManageMembers to true
    Then a PermissionError should be thrown

  Scenario: Changing canEditOwnMemberProfile with manage end user roles permission
    Given an EndUserRoleCommunityPermissions entity with permission to manage end user roles
    When I set canEditOwnMemberProfile to true
    Then the property should be updated to true

  Scenario: Changing canEditOwnMemberProfile with system account permission
    Given an EndUserRoleCommunityPermissions entity with system account permission
    When I set canEditOwnMemberProfile to true
    Then the property should be updated to true

  Scenario: Changing canEditOwnMemberProfile without permission
    Given an EndUserRoleCommunityPermissions entity without permission to manage end user roles or system account
    When I try to set canEditOwnMemberProfile to true
    Then a PermissionError should be thrown

  Scenario: Changing canEditOwnMemberAccounts with manage end user roles permission
    Given an EndUserRoleCommunityPermissions entity with permission to manage end user roles
    When I set canEditOwnMemberAccounts to true
    Then the property should be updated to true

  Scenario: Changing canEditOwnMemberAccounts with system account permission
    Given an EndUserRoleCommunityPermissions entity with system account permission
    When I set canEditOwnMemberAccounts to true
    Then the property should be updated to true

  Scenario: Changing canEditOwnMemberAccounts without permission
    Given an EndUserRoleCommunityPermissions entity without permission to manage end user roles or system account
    When I try to set canEditOwnMemberAccounts to true
    Then a PermissionError should be thrown
