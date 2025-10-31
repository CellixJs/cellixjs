Feature: <Repository> PropertyRepository

  Background:
    Given a PropertyRepository instance with a working Mongoose model, type converter, and passport
    And a valid Mongoose Property document with id "507f1f77bcf86cd799439011", name "Test Property", and a populated community field

  Scenario: Getting a property by id
    When I call getById with "507f1f77bcf86cd799439011"
    Then I should receive a Property domain object
    And the domain object's name should be "Test Property"

  Scenario: Getting a property by id that does not exist
    When I call getById with "nonexistent-id"
    Then an error should be thrown indicating "Property with id nonexistent-id not found"

  Scenario: Getting all properties
    When I call getAll
    Then I should receive an array of Property domain objects
    And the array should contain at least one property with name "Test Property"

  Scenario: Creating a new property instance
    Given a valid Community domain object as the community
    When I call getNewInstance with name "New Property" and the community
    Then I should receive a new Property domain object
    And the domain object's name should be "New Property"
    And the domain object's community should be the given community

  Scenario: Creating a new property instance with an invalid community
    Given an invalid community object
    When I call getNewInstance with name "Invalid Property" and the invalid community
    Then an error should be thrown indicating the community is not valid