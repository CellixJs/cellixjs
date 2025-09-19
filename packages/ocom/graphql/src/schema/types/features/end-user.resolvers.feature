Feature: End User Resolvers

  As an API consumer
  I want to query and create end user entities
  So that I can retrieve end user details or ensure an end user exists via the GraphQL API

  Scenario: Querying the current end user and creating if not exists
    Given a user with a verifiedUser and a verifiedJwt in their context
    When the currentEndUserAndCreateIfNotExists query is executed
    Then it should call User.EndUser.createIfNotExists with the user's sub, family_name, given_name, and email
    And it should return the corresponding EndUser entity

  Scenario: Querying an end user by ID
    Given a valid end user ID
    When the endUserById query is executed with that ID
    Then it should call User.EndUser.queryById with the provided ID and requested fields
    And it should return the corresponding EndUser entity

  Scenario: Unauthorized access to currentEndUserAndCreateIfNotExists
    Given a user without a verifiedJwt in their context
    When the currentEndUserAndCreateIfNotExists query is executed
    Then it should throw an "Unauthorized" error
