Feature: Invite Member

  Scenario: Inviting a member successfully with default expiry
    Given the inviting user with externalId "user-ext-1" exists
    And the MemberInvitationUnitOfWork can save an invitation
    When I call inviteMember with communityId "comm-1", email "invite@example.com", and invitedByExternalId "user-ext-1"
    Then it should call getNewInstance with communityId "comm-1", email "invite@example.com", an empty message, and an expiresAt 7 days from now
    And it should save the new invitation
    And it should return the saved invitation entity reference

  Scenario: Inviting a member with custom expiry days
    Given the inviting user with externalId "user-ext-1" exists
    And the MemberInvitationUnitOfWork can save an invitation
    When I call inviteMember with communityId "comm-1", email "invite@example.com", expiresInDays 14, and invitedByExternalId "user-ext-1"
    Then it should call getNewInstance with an expiresAt 14 days from now
    And it should return the saved invitation entity reference

  Scenario: Inviting a member with a custom message
    Given the inviting user with externalId "user-ext-1" exists
    And the MemberInvitationUnitOfWork can save an invitation
    When I call inviteMember with communityId "comm-1", email "invite@example.com", message "Join us!", and invitedByExternalId "user-ext-1"
    Then getNewInstance should be called with message "Join us!"
    And it should return the saved invitation entity reference

  Scenario: Inviting a member when the inviting user is not found
    Given no user with externalId "unknown-user" exists
    When I try to call inviteMember with invitedByExternalId "unknown-user"
    Then it should throw an error "Inviting user not found"

  Scenario: Inviting a member when save fails
    Given the inviting user with externalId "user-ext-1" exists
    And the MemberInvitationUnitOfWork throws during the transaction
    When I try to call inviteMember with communityId "comm-1", email "invite@example.com", and invitedByExternalId "user-ext-1"
    Then it should throw an error "Unable to create member invitation"
