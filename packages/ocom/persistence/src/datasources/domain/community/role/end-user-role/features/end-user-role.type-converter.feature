Feature: <TypeConverter> EndUserRoleConverter

  Background:
    Given a valid Mongoose EndUserRole document with roleName "Test Role", isDefault true, populated community field, and permissions

  Scenario: Converting a Mongoose EndUserRole document to a domain object
    Given an EndUserRoleConverter instance
    When I call toDomain with the Mongoose EndUserRole document
    Then I should receive an EndUserRole domain object
    And the domain object's roleName should be "Test Role"
    And the domain object's isDefault should be true
    And the domain object's community should be a Community domain object

  Scenario: Converting a domain object to a Mongoose EndUserRole document
    Given an EndUserRoleConverter instance
    And an EndUserRole domain object with roleName "New Role", isDefault false, and valid community
    When I call toPersistence with the EndUserRole domain object
    Then I should receive a Mongoose EndUserRole document
    And the document's roleName should be "New Role"
    And the document's isDefault should be false
    And the document's community should be set to the correct community document