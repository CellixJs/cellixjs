Feature: <AggregateRoot> EndUserRole

  Background:
    Given a valid Passport with community permissions
    And a valid CommunityEntityReference
    And base end user role properties with roleName "Member", isDefault false, and valid timestamps

  Scenario: Creating a new end user role instance
    When I create a new EndUserRole aggregate using getNewInstance with roleName "Member", isDefault false, and a CommunityEntityReference
    Then the role's roleName should be "Member"
    And the role's isDefault should be false
    And the role's community should reference the provided CommunityEntityReference

  Scenario: Changing the roleName with permission to manage end user roles
    Given an EndUserRole aggregate with permission to manage end user roles
    When I set the roleName to "VIP"
    Then the role's roleName should be "VIP"

  Scenario: Changing the roleName without permission
    Given an EndUserRole aggregate without permission to manage end user roles
    When I try to set the roleName to "VIP"
    Then a PermissionError should be thrown

  Scenario: Changing the roleName to an invalid value
    Given an EndUserRole aggregate with permission to manage end user roles
    When I try to set the roleName to an invalid value (e.g., null or empty string)
    Then an error should be thrown indicating the value is invalid

  Scenario: Changing isDefault with permission to manage end user roles
    Given an EndUserRole aggregate with permission to manage end user roles
    When I set isDefault to true
    Then the role's isDefault should be true

  Scenario: Changing isDefault with system account permission
    Given an EndUserRole aggregate with system account permission
    When I set isDefault to true
    Then the role's isDefault should be true

  Scenario: Changing isDefault without permission
    Given an EndUserRole aggregate without permission to manage end user roles or system account
    When I try to set isDefault to true
    Then a PermissionError should be thrown

  Scenario: Deleting a non-default end user role with permission to manage end user roles
    Given an EndUserRole aggregate that is not deleted and is not default, with permission to manage end user roles
    When I call deleteAndReassignTo with a valid EndUserRoleEntityReference
    Then the role should be marked as deleted
    And a RoleDeletedReassignEvent should be added to integration events

  Scenario: Deleting a non-default end user role without permission
    Given an EndUserRole aggregate that is not deleted and is not default, without permission to manage end user roles
    When I try to call deleteAndReassignTo with a valid EndUserRoleEntityReference
    Then a PermissionError should be thrown
    And no RoleDeletedReassignEvent should be emitted

  Scenario: Deleting a default end user role
    Given an EndUserRole aggregate that is default
    When I try to call deleteAndReassignTo with a valid EndUserRoleEntityReference
    Then a PermissionError should be thrown
    And no RoleDeletedReassignEvent should be emitted

  # permissions (delegation)
  Scenario: Accessing permissions entity
    Given an EndUserRole aggregate
    When I access the permissions property
    Then I should receive an EndUserRolePermissions entity instance

  Scenario: Getting roleType, createdAt, updatedAt, and schemaVersion
    Given an EndUserRole aggregate
    Then the roleType property should return the correct value
    And the createdAt property should return the correct date
    And the updatedAt property should return the correct date
    And the schemaVersion property should return the correct version