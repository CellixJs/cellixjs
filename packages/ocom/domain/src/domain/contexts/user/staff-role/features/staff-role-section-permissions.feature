Feature: <Entity> StaffRoleSectionPermissions

  Background:
    Given valid StaffRoleSectionPermissionsProps with all permission flags set to false
    And a valid UserVisa

  Scenario: Changing canManageCommunities with manage staff roles permission
    Given a StaffRoleSectionPermissions entity with permission to manage staff roles
    When I set canManageCommunities to true
    Then the property should be updated to true

  Scenario: Changing canManageCommunities with system account permission
    Given a StaffRoleSectionPermissions entity with system account permission
    When I set canManageCommunities to true
    Then the property should be updated to true

  Scenario: Changing canManageCommunities without permission
    Given a StaffRoleSectionPermissions entity without permission to manage staff roles or system account
    When I try to set canManageCommunities to true
    Then a PermissionError should be thrown

  Scenario: Changing canManageUser with manage staff roles permission
    Given a StaffRoleSectionPermissions entity with permission to manage staff roles
    When I set canManageUser to true
    Then the property should be updated to true

  Scenario: Changing canManageUser with system account permission
    Given a StaffRoleSectionPermissions entity with system account permission
    When I set canManageUser to true
    Then the property should be updated to true

  Scenario: Changing canManageUser without permission
    Given a StaffRoleSectionPermissions entity without permission to manage staff roles or system account
    When I try to set canManageUser to true
    Then a PermissionError should be thrown

  Scenario: Changing canManageFinance with manage staff roles permission
    Given a StaffRoleSectionPermissions entity with permission to manage staff roles
    When I set canManageFinance to true
    Then the property should be updated to true

  Scenario: Changing canManageFinance with system account permission
    Given a StaffRoleSectionPermissions entity with system account permission
    When I set canManageFinance to true
    Then the property should be updated to true

  Scenario: Changing canManageFinance without permission
    Given a StaffRoleSectionPermissions entity without permission to manage staff roles or system account
    When I try to set canManageFinance to true
    Then a PermissionError should be thrown

  Scenario: Changing canManageTechAdmin with manage staff roles permission
    Given a StaffRoleSectionPermissions entity with permission to manage staff roles
    When I set canManageTechAdmin to true
    Then the property should be updated to true

  Scenario: Changing canManageTechAdmin with system account permission
    Given a StaffRoleSectionPermissions entity with system account permission
    When I set canManageTechAdmin to true
    Then the property should be updated to true

  Scenario: Changing canManageTechAdmin without permission
    Given a StaffRoleSectionPermissions entity without permission to manage staff roles or system account
    When I try to set canManageTechAdmin to true
    Then a PermissionError should be thrown
