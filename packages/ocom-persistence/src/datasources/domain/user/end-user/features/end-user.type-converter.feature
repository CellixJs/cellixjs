Feature: <TypeConverter> EndUserConverter

  Background:
    Given a valid Mongoose EndUser document with userType "end-user", externalId "123e4567-e89b-12d3-a456-426614174001", email "user@example.com", displayName "Test User", accessBlocked false, and tags ["tag1", "tag2"]

  Scenario: Converting a Mongoose EndUser document to a domain object
    Given an EndUserConverter instance
    When I call toDomain with the Mongoose EndUser document
    Then I should receive an EndUser domain object
    And the domain object's userType should be "end-user"
    And the domain object's externalId should be "123e4567-e89b-12d3-a456-426614174001"
    And the domain object's email should be "user@example.com"
    And the domain object's displayName should be "Test User"
    And the domain object's accessBlocked should be false
    And the domain object's tags should be ["tag1", "tag2"]

  Scenario: Converting a domain object to a Mongoose EndUser document
    Given an EndUserConverter instance
    And an EndUser domain object with userType "admin", externalId "123e4567-e89b-12d3-a456-426614174002", email "admin@example.com", displayName "Admin User", accessBlocked true, and tags ["admin"]
    When I call toPersistence with the EndUser domain object
    Then I should receive a Mongoose EndUser document
    And the document's userType should be "admin"
    And the document's externalId should be "123e4567-e89b-12d3-a456-426614174002"
    And the document's email should be "admin@example.com"
    And the document's displayName should be "Admin User"
    And the document's accessBlocked should be true
    And the document's tags should be ["admin"]