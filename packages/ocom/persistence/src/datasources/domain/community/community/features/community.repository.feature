Feature: <Repository> CommunityRepository

  Background:
    Given a CommunityRepository instance with a working Mongoose model, type converter, and passport
    And a valid Mongoose Community document with id "community-1", name "Test Community", and a populated createdBy field

  Scenario: Getting a community by id with createdBy populated
    When I call getByIdWithCreatedBy with "community-1"
    Then I should receive a Community domain object
    And the domain object's name should be "Test Community"
    And the domain object's createdBy should be an EndUser domain object with the correct user data

  Scenario: Getting a community by id that does not exist
    When I call getByIdWithCreatedBy with "nonexistent-id"
    Then an error should be thrown indicating "Community with id nonexistent-id not found"

  Scenario: Creating a new community instance
    Given a valid EndUser domain object as the user
    When I call getNewInstance with name "New Community" and the user
    Then I should receive a new Community domain object
    And the domain object's name should be "New Community"
    And the domain object's createdBy should be the given user

  Scenario: Creating a new community instance with an invalid user
    Given an invalid user object
    When I call getNewInstance with name "Invalid Community" and the invalid user
    Then an error should be thrown indicating the user is not valid
