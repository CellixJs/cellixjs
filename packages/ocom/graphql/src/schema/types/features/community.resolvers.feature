Feature: Community Resolvers

  As an API consumer
  I want to query and mutate community entities
  So that I can retrieve and create communities through the GraphQL API

  Scenario: Querying the current community
    Given a user with a verifiedUser and a communityId in their context
    When the currentCommunity query is executed
    Then it should call Community.Community.queryById with the user's communityId
    And it should return the corresponding Community entity

  Scenario: Querying a community by ID
    Given a valid community ID
    When the communityById query is executed with that ID
    Then it should call Community.Community.queryById with the provided ID
    And it should return the corresponding Community entity

  Scenario: Querying communities for the current end user
    Given a user with a verifiedUser and a verifiedJwt in their context
    When the communitiesForCurrentEndUser query is executed
    Then it should call Community.Community.queryByEndUserExternalId with the user's sub
    And it should return a list of Community entities

  Scenario: Creating a community
    Given a user with a verifiedUser and a verifiedJwt in their context
    And a valid CommunityCreateInput
    When the communityCreate mutation is executed with the input
    Then it should call Community.Community.create with the input name and the user's sub
    And it should return a CommunityMutationResult with success true and the created community

  Scenario: Unauthorized access to currentCommunity
    Given a user without a communityId in their context
    When the currentCommunity query is executed
    Then it should throw an "Unauthorized" error

  Scenario: Unauthorized access to communitiesForCurrentEndUser
    Given a user without a verifiedJwt in their context
    When the communitiesForCurrentEndUser query is executed
    Then it should throw an "Unauthorized" error

  Scenario: Unauthorized community creation
    Given a user without a verifiedJwt in their context
    When the communityCreate mutation is executed
    Then it should throw an "Unauthorized" error

  Scenario: Community creation error handling
    Given a user with a verifiedUser and a verifiedJwt in their context
    And Community.Community.create throws an error
    When the communityCreate mutation is executed
    Then it should return a CommunityMutationResult with success false and the error message
