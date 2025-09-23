Feature: <Entity> StaffRoleCommunityPermissions

  Background:
    Given valid StaffRoleCommunityPermissionsProps with all permission flags set to false
    And a valid UserVisa

  Scenario: Changing canManageStaffRolesAndPermissions with manage staff roles permission
    Given a StaffRoleCommunityPermissions entity with permission to manage staff roles
    When I set canManageStaffRolesAndPermissions to true
    Then the property should be updated to true

  Scenario: Changing canManageStaffRolesAndPermissions with system account permission
    Given a StaffRoleCommunityPermissions entity with system account permission
    When I set canManageStaffRolesAndPermissions to true
    Then the property should be updated to true

  Scenario: Changing canManageStaffRolesAndPermissions without permission
    Given a StaffRoleCommunityPermissions entity without permission to manage staff roles or system account
    When I try to set canManageStaffRolesAndPermissions to true
    Then a PermissionError should be thrown

  Scenario: Changing canManageAllCommunities with manage staff roles permission
    Given a StaffRoleCommunityPermissions entity with permission to manage staff roles
    When I set canManageAllCommunities to true
    Then the property should be updated to true

  Scenario: Changing canManageAllCommunities with system account permission
    Given a StaffRoleCommunityPermissions entity with system account permission
    When I set canManageAllCommunities to true
    Then the property should be updated to true

  Scenario: Changing canManageAllCommunities without permission
    Given a StaffRoleCommunityPermissions entity without permission to manage staff roles or system account
    When I try to set canManageAllCommunities to true
    Then a PermissionError should be thrown

  Scenario: Changing canDeleteCommunities with manage staff roles permission
    Given a StaffRoleCommunityPermissions entity with permission to manage staff roles
    When I set canDeleteCommunities to true
    Then the property should be updated to true

  Scenario: Changing canDeleteCommunities with system account permission
    Given a StaffRoleCommunityPermissions entity with system account permission
    When I set canDeleteCommunities to true
    Then the property should be updated to true

  Scenario: Changing canDeleteCommunities without permission
    Given a StaffRoleCommunityPermissions entity without permission to manage staff roles or system account
    When I try to set canDeleteCommunities to true
    Then a PermissionError should be thrown

  Scenario: Changing canChangeCommunityOwner with manage staff roles permission
    Given a StaffRoleCommunityPermissions entity with permission to manage staff roles
    When I set canChangeCommunityOwner to true
    Then the property should be updated to true

  Scenario: Changing canChangeCommunityOwner with system account permission
    Given a StaffRoleCommunityPermissions entity with system account permission
    When I set canChangeCommunityOwner to true
    Then the property should be updated to true

  Scenario: Changing canChangeCommunityOwner without permission
    Given a StaffRoleCommunityPermissions entity without permission to manage staff roles or system account
    When I try to set canChangeCommunityOwner to true
    Then a PermissionError should be thrown

  Scenario: Changing canReIndexSearchCollections with manage staff roles permission
    Given a StaffRoleCommunityPermissions entity with permission to manage staff roles
    When I set canReIndexSearchCollections to true
    Then the property should be updated to true

  Scenario: Changing canReIndexSearchCollections with system account permission
    Given a StaffRoleCommunityPermissions entity with system account permission
    When I set canReIndexSearchCollections to true
    Then the property should be updated to true

  Scenario: Changing canReIndexSearchCollections without permission
    Given a StaffRoleCommunityPermissions entity without permission to manage staff roles or system account
    When I try to set canReIndexSearchCollections to true
    Then a PermissionError should be thrown