Feature: <Entity> EndUserRolePermissions

  Background:
    Given valid EndUserRolePermissionsProps with all required permission props
    And a valid UserVisa

  Scenario: Accessing communityPermissions
    Given a EndUserRolePermissions entity
    When I access the communityPermissions property
    Then I should receive a EndUserRoleCommunityPermissions entity instance

  Scenario: Accessing propertyPermissions
    Given a EndUserRolePermissions entity
    When I access the propertyPermissions property
    Then I should receive a EndUserRolePropertyPermissions entity instance

  Scenario: Accessing serviceTicketPermissions
    Given a EndUserRolePermissions entity
    When I access the serviceTicketPermissions property
    Then I should receive a EndUserRoleServiceTicketPermissions entity instance

  Scenario: Accessing servicePermissions
    Given a EndUserRolePermissions entity
    When I access the servicePermissions property
    Then I should receive a EndUserRoleServicePermissions entity instance

  Scenario: Accessing violationTicketPermissions
    Given a EndUserRolePermissions entity
    When I access the violationTicketPermissions property
    Then I should receive a EndUserRoleViolationTicketPermissions entity instance