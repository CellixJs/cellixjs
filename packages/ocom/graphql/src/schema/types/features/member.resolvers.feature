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

  Scenario: Querying members by community ID
    Given a signed in user with subject "user-sub-123"
    And the member service can return members for community "community-456"
    When the membersByCommunityId query is executed with communityId "community-456"
    Then it should call Community.Member.queryByCommunityId with the communityId
    And it should return the list of members for that community

  Scenario: Querying members by community ID without authentication
    Given a user without a verified JWT
    When the membersByCommunityId query is executed with communityId "community-456"
    Then it should throw an "Unauthorized" error

  Scenario: Adding a member to a community
    Given a signed in user with subject "admin-sub-456"
    And the member add service returns a new member
    When the memberAdd mutation is executed
    Then it should return a MemberMutationResult with success true and the new member

  Scenario: Adding a member to a community fails
    Given a signed in user with subject "admin-sub-456"
    And the member add service throws an error "Cannot add member"
    When the memberAdd mutation is executed
    Then it should return a MemberMutationResult with success false and the error message

  Scenario: Removing a member from a community
    Given a signed in user with subject "admin-sub-456"
    And the member remove service returns the removed member
    When the memberRemove mutation is executed
    Then it should return a MemberMutationResult with success true

  Scenario: Removing a member from a community fails
    Given a signed in user with subject "admin-sub-456"
    And the member remove service throws an error "Cannot remove member"
    When the memberRemove mutation is executed
    Then it should return a MemberMutationResult with success false and the error message

  Scenario: Updating a member's role
    Given a signed in user with subject "admin-sub-456"
    And the member role update service returns the updated member
    When the memberRoleUpdate mutation is executed
    Then it should return a MemberMutationResult with success true

  Scenario: Adding a member without authentication
    Given a user without a verified JWT
    When the memberAdd mutation is executed unauthenticated
    Then it should return a MemberMutationResult with success false and the error message
