Feature: Creating a staff role

  Scenario: Creating a staff role successfully
    Given a staff role with name "Test Role" does not exist
    When I create a staff role with name "Test Role", isDefault false, and no permissions
    Then it should return a staff role entity reference with name "Test Role" and isDefault false

  Scenario: Creating a staff role with permissions
    Given a staff role with name "Admin Role" does not exist
    When I create a staff role with name "Admin Role", isDefault true, and permissions
    Then it should return a staff role entity reference with name "Admin Role" and isDefault true

  Scenario: Creating a staff role with duplicate name
    Given a staff role with name "Test Role" already exists
    When I create a staff role with name "Test Role", isDefault false, and no permissions
    Then it should throw an error "Staff role with name Test Role already exists"

  Scenario: Creating a staff role when save fails
    Given a staff role with name "Test Role" does not exist
    When I create a staff role but save fails
    Then it should throw an error "Unable to create staff role"