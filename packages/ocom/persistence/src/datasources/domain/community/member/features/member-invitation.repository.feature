Feature: <Repository> MemberInvitationRepository

  Background:
    Given a Mongoose MemberInvitation model with a valid document
    And a valid Passport for domain operations

  Scenario: Getting a MemberInvitation by id when it exists
    When I call getById with a valid id
    Then it should return the corresponding MemberInvitation domain object

  Scenario: Getting a MemberInvitation by id when it does not exist
    When I call getById with an id that does not exist
    Then an error should be thrown indicating the invitation was not found

  Scenario: Getting MemberInvitations by communityId
    When I call getByCommunityId with communityId "comm-1"
    Then it should return a list of MemberInvitation domain objects for that community

  Scenario: Getting MemberInvitations by communityId returns empty list when none found
    When I call getByCommunityId with a communityId that has no invitations
    Then it should return an empty array

  Scenario: Creating a new MemberInvitation instance
    When I call getNewInstance with communityId "comm-1", email "test@example.com", message "Hello", a future expiresAt, and invitedById "507f1f77bcf86cd799439011"
    Then it should return a new MemberInvitation domain object
    And the invitation email should be "test@example.com"
    And the invitation communityId should be "comm-1"
    And the invitation status should be "PENDING"
