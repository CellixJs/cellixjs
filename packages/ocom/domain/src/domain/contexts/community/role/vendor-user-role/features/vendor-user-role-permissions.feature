Feature: <Entity> VendorUserRolePermissions

  Background:
    Given valid VendorUserRolePermissionsProps with all required permission props
    And a valid UserVisa

  Scenario: Accessing communityPermissions
    Given a VendorUserRolePermissions entity
    When I access the communityPermissions property
    Then I should receive a VendorUserRoleCommunityPermissions entity instance

  Scenario: Accessing propertyPermissions
    Given a VendorUserRolePermissions entity
    When I access the propertyPermissions property
    Then I should receive a VendorUserRolePropertyPermissions entity instance

  Scenario: Accessing serviceTicketPermissions
    Given a VendorUserRolePermissions entity
    When I access the serviceTicketPermissions property
    Then I should receive a VendorUserRoleServiceTicketPermissions entity instance

  Scenario: Accessing servicePermissions
    Given a VendorUserRolePermissions entity
    When I access the servicePermissions property
    Then I should receive a VendorUserRoleServicePermissions entity instance

  Scenario: Accessing violationTicketPermissions
    Given a VendorUserRolePermissions entity
    When I access the violationTicketPermissions property
    Then I should receive a VendorUserRoleViolationTicketPermissions entity instance