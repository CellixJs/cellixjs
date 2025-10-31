Feature: <TypeConverter> StaffRoleConverter

  Background:
    Given a valid Mongoose StaffRole document with roleName "Manager", isDefault false, and roleType "staff"

  Scenario: Converting a Mongoose StaffRole document to a domain object
    Given a StaffRoleConverter instance
    When I call toDomain with the Mongoose StaffRole document
    Then I should receive a StaffRole domain object
    And the domain object's roleName should be "Manager"
    And the domain object's isDefault should be false
    And the domain object's roleType should be "staff"

  Scenario: Converting a domain object to a Mongoose StaffRole document
    Given a StaffRoleConverter instance
    And a StaffRole domain object with roleName "Supervisor", isDefault true, and roleType "admin"
    When I call toPersistence with the StaffRole domain object
    Then I should receive a Mongoose StaffRole document
    And the document's roleName should be "Supervisor"
    And the document's isDefault should be true
    And the document's roleType should be "admin"