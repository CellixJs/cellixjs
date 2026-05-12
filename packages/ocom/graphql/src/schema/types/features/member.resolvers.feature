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

  Scenario: Inviting a member successfully
    Given a signed in user with subject "user-sub-123"
    And the member invitation service can create an invitation
    When the inviteMember mutation is executed with communityId "community-123" and email "test@example.com"
    Then it should return a status with success true
    And it should return the invitation with email "test@example.com"

  Scenario: Inviting a member without authentication
    Given a user without a verified JWT
    When the inviteMember mutation is executed with communityId "community-123" and email "test@example.com"
    Then it should return a status with success false
    And the error message should be "Unauthorized"

  Scenario: Bulk inviting members successfully
    Given a signed in user with subject "user-sub-123"
    And the member bulk invitation service can create invitations
    When the bulkInviteMembers mutation is executed with communityId "community-123" and emails "a@example.com" and "b@example.com"
    Then it should return a status with success true
    And it should return 2 invitations

  Scenario: Bulk inviting members without authentication
    Given a user without a verified JWT
    When the bulkInviteMembers mutation is executed with communityId "community-123" and emails "a@example.com" and "b@example.com"
    Then it should return a status with success false
    And the error message should be "Unauthorized"

  Scenario: MemberInvitation invitedBy resolver returns end user
    Given a member invitation with invitedBy id "user-id-1"
    And the end user service can return a user for that id
    When the MemberInvitation.invitedBy resolver is executed
    Then it should call User.EndUser.queryById with "user-id-1"
    And it should return the resolved end user

  Scenario: MemberInvitation acceptedBy resolver when present
    Given a member invitation with acceptedBy id "user-id-2"
    And the end user service can return a user for that id
    When the MemberInvitation.acceptedBy resolver is executed
    Then it should call User.EndUser.queryById with "user-id-2"
    And it should return the resolved end user

  Scenario: MemberInvitation acceptedBy resolver when absent
    Given a member invitation with no acceptedBy set
    When the MemberInvitation.acceptedBy resolver is executed
    Then it should return null
