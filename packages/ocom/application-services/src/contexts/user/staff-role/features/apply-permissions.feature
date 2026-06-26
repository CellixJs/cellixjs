Feature: Apply Staff Role Permissions

  Background:
    Given a staff role with all permissions set to false

  Scenario: Apply community permissions
    When I apply community permissions with all values set to true
    Then the community permissions should all be true

  Scenario: Apply partial community permissions
    When I apply community permissions with only canManageCommunities set to true
    Then only canManageCommunities should be true

  Scenario: Apply undefined community permissions
    When I apply undefined community permissions
    Then the community permissions should remain unchanged

  Scenario: Apply user permissions
    When I apply user permissions with all values set to true
    Then the user permissions should all be true

  Scenario: Apply partial user permissions
    When I apply user permissions with only canViewStaffUsers set to true
    Then only canViewStaffUsers should be true

  Scenario: Apply undefined user permissions
    When I apply undefined user permissions
    Then the user permissions should remain unchanged

  Scenario: Apply staff role permissions
    When I apply staff role permissions with all values set to true
    Then the staff role permissions should all be true

  Scenario: Apply partial staff role permissions
    When I apply staff role permissions with only canEditRole set to true
    Then only canEditRole should be true

  Scenario: Apply undefined staff role permissions
    When I apply undefined staff role permissions
    Then the staff role permissions should remain unchanged

  Scenario: Apply finance permissions
    When I apply finance permissions with all values set to true
    Then the finance permissions should all be true

  Scenario: Apply partial finance permissions
    When I apply finance permissions with only canViewFinanceConfigs set to true
    Then only canViewFinanceConfigs should be true

  Scenario: Apply undefined finance permissions
    When I apply undefined finance permissions
    Then the finance permissions should remain unchanged

  Scenario: Apply tech admin permissions
    When I apply tech admin permissions with all values set to true
    Then the tech admin permissions should all be true

  Scenario: Apply partial tech admin permissions
    When I apply tech admin permissions with only canViewDatabaseDocuments set to true
    Then only canViewDatabaseDocuments should be true

  Scenario: Apply undefined tech admin permissions
    When I apply undefined tech admin permissions
    Then the tech admin permissions should remain unchanged