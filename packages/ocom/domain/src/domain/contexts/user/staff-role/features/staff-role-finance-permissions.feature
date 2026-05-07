Feature: <Entity> StaffRoleFinancePermissions

  Background:
    Given valid StaffRoleFinancePermissionsProps with all permission flags set to false
    And a valid UserVisa

  Scenario: Changing canManageFinance with manage staff roles permission
    Given a StaffRoleFinancePermissions entity with permission to manage staff roles
    When I set canManageFinance to true
    Then the property should be updated to true

  Scenario: Changing canManageFinance with system account permission
    Given a StaffRoleFinancePermissions entity with system account permission
    When I set canManageFinance to true
    Then the property should be updated to true

  Scenario: Changing canManageFinance without permission
    Given a StaffRoleFinancePermissions entity without permission to manage staff roles or system account
    When I try to set canManageFinance to true
    Then a PermissionError should be thrown

  Scenario: Changing canViewGLBatchSummaries with manage staff roles permission
    Given a StaffRoleFinancePermissions entity with permission to manage staff roles
    When I set canViewGLBatchSummaries to true
    Then the property should be updated to true

  Scenario: Changing canViewGLBatchSummaries without permission
    Given a StaffRoleFinancePermissions entity without permission to manage staff roles or system account
    When I try to set canViewGLBatchSummaries to true
    Then a PermissionError should be thrown

  Scenario: Changing canViewFinanceConfigs with manage staff roles permission
    Given a StaffRoleFinancePermissions entity with permission to manage staff roles
    When I set canViewFinanceConfigs to true
    Then the property should be updated to true

  Scenario: Changing canViewFinanceConfigs without permission
    Given a StaffRoleFinancePermissions entity without permission to manage staff roles or system account
    When I try to set canViewFinanceConfigs to true
    Then a PermissionError should be thrown

  Scenario: Changing canCreateFinanceConfigs with manage staff roles permission
    Given a StaffRoleFinancePermissions entity with permission to manage staff roles
    When I set canCreateFinanceConfigs to true
    Then the property should be updated to true

  Scenario: Changing canCreateFinanceConfigs without permission
    Given a StaffRoleFinancePermissions entity without permission to manage staff roles or system account
    When I try to set canCreateFinanceConfigs to true
    Then a PermissionError should be thrown
