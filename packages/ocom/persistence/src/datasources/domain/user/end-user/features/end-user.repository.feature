Feature: <Repository> EndUserRepository

  Background:
    Given an EndUserRepository instance with a working Mongoose model, type converter, and passport
    And a valid Mongoose EndUser document with externalId "123e4567-e89b-12d3-a456-426614174001", email "user@example.com", displayName "Test User", and userType "end-user"

  Scenario: Getting an end user by externalId
    When I call getByExternalId with "123e4567-e89b-12d3-a456-426614174001"
    Then I should receive an EndUser domain object
    And the domain object's email should be "user@example.com"
    And the domain object's displayName should be "Test User"

  Scenario: Getting an end user by externalId that does not exist
    When I call getByExternalId with "nonexistent-id"
    Then an error should be thrown indicating "User with externalId nonexistent-id not found"

  Scenario: Creating a new end user instance
    When I call getNewInstance with externalId "123e4567-e89b-12d3-a456-426614174002", lastName "Smith", restOfName "Alice", and email "alice@example.com"
    Then I should receive a new EndUser domain object
    And the domain object's externalId should be "123e4567-e89b-12d3-a456-426614174002"
    And the domain object's displayName should be "Alice Smith"
    And the domain object's email should be "alice@example.com"

  Scenario: Creating a new end user instance with no restOfName
    When I call getNewInstance with externalId "123e4567-e89b-12d3-a456-426614174003", lastName "Smith", restOfName undefined, and email "smith@example.com"
    Then I should receive a new EndUser domain object
    And the domain object's externalId should be "123e4567-e89b-12d3-a456-426614174003"
    And the domain object's displayName should be "Smith"
    And the domain object's email should be "smith@example.com"

  Scenario: Deleting an end user by id
    When I call delete with "123e4567-e89b-12d3-a456-426614174001"
    Then the user with id "123e4567-e89b-12d3-a456-426614174001" should be removed from the database
