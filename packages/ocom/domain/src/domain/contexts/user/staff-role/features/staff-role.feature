Feature: <AggregateRoot> StaffRole

  Background:
    Given a valid Passport with staff role permissions
    And base staff role properties with roleName "Support", isDefault false, roleType "staff-role", and valid timestamps

  Scenario: Creating a new staff role instance
    When I create a new StaffRole aggregate using getNewInstance with roleName "Support" and isDefault false
    Then the staff role's roleName should be "Support"
    And the staff role's isDefault should be false

  # roleName
  Scenario: Changing the roleName with permission to manage staff roles
    Given a StaffRole aggregate with permission to manage staff roles and permissions
    When I set the roleName to "Manager"
    Then the staff role's roleName should be "Manager"

  Scenario: Changing the roleName with system account permission
    Given a StaffRole aggregate with system account permission
    When I set the roleName to "Manager"
    Then the staff role's roleName should be "Manager"

  Scenario: Changing the roleName without permission
    Given a StaffRole aggregate without permission to manage staff roles and permissions or system account
    When I try to set the roleName to "Manager"
    Then a PermissionError should be thrown

  Scenario: Changing the roleName to an invalid value
    Given a StaffRole aggregate with permission to manage staff roles and permissions
    When I try to set the roleName to an invalid value (e.g., empty string)
    Then an error should be thrown indicating the value is invalid

  # isDefault
  Scenario: Changing isDefault with permission to manage staff roles
    Given a StaffRole aggregate with permission to manage staff roles and permissions
    When I set isDefault to true
    Then the staff role's isDefault should be true

  Scenario: Changing isDefault with system account permission
    Given a StaffRole aggregate with system account permission
    When I set isDefault to true
    Then the staff role's isDefault should be true

  Scenario: Changing isDefault without permission
    Given a StaffRole aggregate without permission to manage staff roles and permissions or system account
    When I try to set isDefault to true
    Then a PermissionError should be thrown

  # deleteAndReassignTo
  Scenario: Deleting a non-default staff role with permission
    Given a StaffRole aggregate that is not deleted and is not default, with permission to manage staff roles and permissions
    When I call deleteAndReassignTo with a valid StaffRoleEntityReference
    Then the staff role should be marked as deleted
    And a RoleDeletedReassignEvent should be added to integration events

  Scenario: Deleting a non-default staff role without permission
    Given a StaffRole aggregate that is not deleted and is not default, without permission to manage staff roles and permissions
    When I try to call deleteAndReassignTo with a valid StaffRoleEntityReference
    Then a PermissionError should be thrown
    And no RoleDeletedReassignEvent should be emitted

  Scenario: Deleting a default staff role
    Given a StaffRole aggregate that is default
    When I try to call deleteAndReassignTo with a valid StaffRoleEntityReference
    Then a PermissionError should be thrown
    And no RoleDeletedReassignEvent should be emitted

  # permissions (delegation)
  Scenario: Accessing permissions entity
    Given a StaffRole aggregate
    When I access the permissions property
    Then I should receive a StaffRolePermissions entity instance

  # read-only properties
  Scenario: Getting roleType, createdAt, updatedAt, and schemaVersion
    Given a StaffRole aggregate
    Then the roleType property should return the correct value
    And the createdAt property should return the correct date
    And the updatedAt property should return the correct date
    And the schemaVersion property should return the correct version
