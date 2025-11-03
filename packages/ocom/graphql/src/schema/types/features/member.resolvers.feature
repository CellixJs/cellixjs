Feature: Member resolvers

  Scenario: Resolving the community for a member
    Given a member with communityId "community-123"
    And the community service can return that community
    When the Member.community resolver is executed
    Then it should call Community.Community.queryById with the member's communityId
    And it should return the resolved community

  Scenario: Checking if a member is an administrator
    Given a member with id "member-1"
    And the member service indicates the member is an admin
    When the Member.isAdmin resolver is executed
    Then it should call Community.Member.determineIfAdmin with the member's id
    And it should return true

  Scenario: Querying members for the current end user
    Given a signed in user with subject "user-sub-123"
    And the member service can return members for that subject
    When the membersForCurrentEndUser query is executed
    Then it should call Community.Member.queryByEndUserExternalId with the subject
    And it should return the list of members

  Scenario: Querying members for the current end user without authentication
    Given a user without a verified JWT
    When the membersForCurrentEndUser query is executed
    Then it should throw an "Unauthorized" error
