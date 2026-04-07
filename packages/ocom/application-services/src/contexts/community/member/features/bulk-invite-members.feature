Feature: Bulk Invite Members

  Scenario: Bulk inviting multiple members successfully
    Given the inviting user with externalId "user-ext-1" exists
    And the MemberInvitationUnitOfWork can save invitations
    When I call bulkInviteMembers with communityId "comm-1", 2 invitations, and invitedByExternalId "user-ext-1"
    Then it should return 2 invitation entity references
    And getNewInstance should be called twice

  Scenario: Bulk inviting with default expiry
    Given the inviting user with externalId "user-ext-1" exists
    And the MemberInvitationUnitOfWork can save invitations
    When I call bulkInviteMembers without specifying expiresInDays
    Then getNewInstance should be called with an expiresAt 7 days from now

  Scenario: Bulk inviting with custom expiry
    Given the inviting user with externalId "user-ext-1" exists
    And the MemberInvitationUnitOfWork can save invitations
    When I call bulkInviteMembers with expiresInDays 30
    Then getNewInstance should be called with an expiresAt 30 days from now

  Scenario: Bulk inviting when the inviting user is not found
    Given no user with externalId "unknown-user" exists
    When I try to call bulkInviteMembers with invitedByExternalId "unknown-user"
    Then it should throw an error "Inviting user not found"

  Scenario: Bulk inviting with partial failures
    Given the inviting user with externalId "user-ext-1" exists
    And the MemberInvitationUnitOfWork fails for the second invitation but succeeds for the first
    When I call bulkInviteMembers with communityId "comm-1", 2 invitations, and invitedByExternalId "user-ext-1"
    Then it should return only 1 invitation entity reference
    And no error should be thrown

  Scenario: Bulk inviting with an empty list
    Given the inviting user with externalId "user-ext-1" exists
    And the MemberInvitationUnitOfWork can save invitations
    When I call bulkInviteMembers with an empty invitations list
    Then it should return an empty array
