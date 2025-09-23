Feature: <Entity> StaffRolePermissions

  Background:
    Given valid StaffRolePermissionsProps with all required permission props
    And a valid UserVisa

  Scenario: Accessing communityPermissions
    Given a StaffRolePermissions entity
    When I access the communityPermissions property
    Then I should receive a StaffRoleCommunityPermissions entity instance

  Scenario: Accessing propertyPermissions
    Given a StaffRolePermissions entity
    When I access the propertyPermissions property
    Then I should receive a StaffRolePropertyPermissions entity instance

  Scenario: Accessing serviceTicketPermissions
    Given a StaffRolePermissions entity
    When I access the serviceTicketPermissions property
    Then I should receive a StaffRoleServiceTicketPermissions entity instance

  Scenario: Accessing servicePermissions
    Given a StaffRolePermissions entity
    When I access the servicePermissions property
    Then I should receive a StaffRoleServicePermissions entity instance

  Scenario: Accessing violationTicketPermissions
    Given a StaffRolePermissions entity
    When I access the violationTicketPermissions property
    Then I should receive a StaffRoleViolationTicketPermissions entity instance