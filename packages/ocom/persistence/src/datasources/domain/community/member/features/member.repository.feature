Feature: <Repository> MemberRepository

  Background:
    Given a MemberRepository instance with a working Mongoose model, type converter, and passport
    And a valid Mongoose Member document with id "507f1f77bcf86cd799439011", name "Test Member", and a populated community field

  Scenario: Getting a member by id
    When I call getById with "507f1f77bcf86cd799439011"
    Then I should receive a Member domain object
    And the domain object's name should be "Test Member"

  Scenario: Getting a member by id that does not exist
    When I call getById with "nonexistent-id"
    Then an error should be thrown indicating "Member with id nonexistent-id not found"

  Scenario: Getting all members
    When I call getAll
    Then I should receive an array of Member domain objects
    And the array should contain at least one member with name "Test Member"

  Scenario: Getting members assigned to a role
    Given a role with id "507f1f77bcf86cd799439013"
    When I call getAssignedToRole with "507f1f77bcf86cd799439013"
    Then I should receive an array of Member domain objects
    And all members should have the specified role

  Scenario: Creating a new member instance
    Given a valid Community domain object as the community
    When I call getNewInstance with name "New Member" and the community
    Then I should receive a new Member domain object
    And the domain object's name should be "New Member"
    And the domain object's community should be the given community

  Scenario: Creating a new member instance with an invalid community
    Given an invalid community object
    When I call getNewInstance with name "Invalid Member" and the invalid community
    Then an error should be thrown indicating the community is not valid