Feature: Staff User Resolvers

  As an API consumer
  I want to query and create staff user entities
  So that I can retrieve a staff user or ensure one exists via the GraphQL API

  Scenario: Querying the current staff user and creating if not exists
    Given a user with a verifiedJwt in their context
    When the currentStaffUserAndCreateIfNotExists query is executed
    Then it should call User.StaffUser.createIfNotExists with the JWT claims
    And it should return the corresponding StaffUser entity

  Scenario: Querying the current staff user with AAD roles
    Given a user with a verifiedJwt that includes AAD roles in their context
    When the currentStaffUserAndCreateIfNotExists query is executed
    Then it should call User.StaffUser.createIfNotExists with the AAD roles
    And it should return the corresponding StaffUser entity

  Scenario: Querying the current staff user with no JWT
    Given a user without a verifiedJwt in their context
    When the currentStaffUserAndCreateIfNotExists query is executed
    Then it should throw an "Unauthorized" error
