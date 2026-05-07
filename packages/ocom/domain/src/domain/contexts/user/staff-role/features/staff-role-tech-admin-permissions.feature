Feature: <Entity> StaffRoleTechAdminPermissions

  Background:
    Given valid StaffRoleTechAdminPermissionsProps with all permission flags set to false
    And a valid UserVisa

  Scenario: Changing canManageTechAdmin with manage staff roles permission
    Given a StaffRoleTechAdminPermissions entity with permission to manage staff roles
    When I set canManageTechAdmin to true
    Then the property should be updated to true

  Scenario: Changing canManageTechAdmin with system account permission
    Given a StaffRoleTechAdminPermissions entity with system account permission
    When I set canManageTechAdmin to true
    Then the property should be updated to true

  Scenario: Changing canManageTechAdmin without permission
    Given a StaffRoleTechAdminPermissions entity without permission to manage staff roles or system account
    When I try to set canManageTechAdmin to true
    Then a PermissionError should be thrown

  Scenario: Changing canViewDatabaseExplorer with manage staff roles permission
    Given a StaffRoleTechAdminPermissions entity with permission to manage staff roles
    When I set canViewDatabaseExplorer to true
    Then the property should be updated to true

  Scenario: Changing canViewDatabaseExplorer without permission
    Given a StaffRoleTechAdminPermissions entity without permission to manage staff roles or system account
    When I try to set canViewDatabaseExplorer to true
    Then a PermissionError should be thrown

  Scenario: Changing canViewBlobExplorer with manage staff roles permission
    Given a StaffRoleTechAdminPermissions entity with permission to manage staff roles
    When I set canViewBlobExplorer to true
    Then the property should be updated to true

  Scenario: Changing canViewBlobExplorer without permission
    Given a StaffRoleTechAdminPermissions entity without permission to manage staff roles or system account
    When I try to set canViewBlobExplorer to true
    Then a PermissionError should be thrown

  Scenario: Changing canViewQueueDashboard with manage staff roles permission
    Given a StaffRoleTechAdminPermissions entity with permission to manage staff roles
    When I set canViewQueueDashboard to true
    Then the property should be updated to true

  Scenario: Changing canViewQueueDashboard without permission
    Given a StaffRoleTechAdminPermissions entity without permission to manage staff roles or system account
    When I try to set canViewQueueDashboard to true
    Then a PermissionError should be thrown

  Scenario: Changing canSendQueueMessages with manage staff roles permission
    Given a StaffRoleTechAdminPermissions entity with permission to manage staff roles
    When I set canSendQueueMessages to true
    Then the property should be updated to true

  Scenario: Changing canSendQueueMessages without permission
    Given a StaffRoleTechAdminPermissions entity without permission to manage staff roles or system account
    When I try to set canSendQueueMessages to true
    Then a PermissionError should be thrown
