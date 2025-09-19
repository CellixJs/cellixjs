Feature: <Repository> EndUserRoleRepository

  Background:
    Given an EndUserRoleRepository instance with a working Mongoose model, type converter, and passport
    And a valid Mongoose EndUserRole document with id "507f1f77bcf86cd799439011", roleName "Test Role", and a populated community field

  Scenario: Getting an end user role by id
    When I call getById with "507f1f77bcf86cd799439011"
    Then I should receive an EndUserRole domain object
    And the domain object's roleName should be "Test Role"

  Scenario: Getting an end user role by id that does not exist
    When I call getById with "nonexistent-id"
    Then an error should be thrown indicating "EndUserRole with id nonexistent-id not found"

  Scenario: Creating a new end user role instance
    Given a valid Community domain object as the community
    When I call getNewInstance with roleName "New Role", isDefault false, and the community
    Then I should receive a new EndUserRole domain object
    And the domain object's roleName should be "New Role"
    And the domain object's isDefault should be false

  Scenario: Creating a new end user role instance with an invalid community
    Given an invalid community object
    When I call getNewInstance with roleName "Invalid Role", isDefault true, and the invalid community
    Then an error should be thrown indicating the community is not valid