Feature: <Repository> StaffRoleRepository

  Background:
    Given a StaffRoleRepository instance with a working Mongoose model, type converter, and passport
    And a valid Mongoose StaffRole document with id "role-1", roleName "Manager", isDefault false, and roleType "staff"

  Scenario: Getting a staff role by id
    When I call getById with "role-1"
    Then I should receive a StaffRole domain object
    And the domain object's roleName should be "Manager"
    And the domain object's isDefault should be false
    And the domain object's roleType should be "staff"

  Scenario: Getting a staff role by id that does not exist
    When I call getById with "nonexistent-id"
    Then an error should be thrown indicating "StaffRole with id nonexistent-id not found"

  Scenario: Getting a staff role by roleName
    When I call getByRoleName with "Manager"
    Then I should receive a StaffRole domain object
    And the domain object's roleName should be "Manager"
    And the domain object's isDefault should be false
    And the domain object's roleType should be "staff"

  Scenario: Getting a staff role by roleName that does not exist
    When I call getByRoleName with "nonexistent-role"
    Then an error should be thrown indicating "StaffRole with roleName nonexistent-role not found"

  Scenario: Creating a new staff role instance
    When I call getNewInstance with name "Supervisor"
    Then I should receive a new StaffRole domain object
    And the domain object's roleName should be "Supervisor"
    And the domain object's isDefault should be false
    And the domain object's roleType should be "staff"