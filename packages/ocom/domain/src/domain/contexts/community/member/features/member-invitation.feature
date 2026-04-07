Feature: <AggregateRoot> MemberInvitation

  Background:
    Given a valid Passport with permission to manage members
    And a valid communityId "community-abc"
    And a valid invitedBy EndUserEntityReference with id "user-123"
    And base invitation props with id "inv-001", communityId "community-abc", email "invitee@example.com", message "Welcome!", status "PENDING", a future expiresAt, and valid timestamps

  Scenario: Creating a new invitation with permission to manage members
    Given a passport with permission to manage members
    When I create a new MemberInvitation using getNewInstance with email "invitee@example.com", message "Welcome!", and expiresAt 7 days from now
    Then the invitation email should be "invitee@example.com"
    And the invitation message should be "Welcome!"
    And the invitation status should be "PENDING"
    And the invitation communityId should be "community-abc"
    And the invitation invitedBy id should be "user-123"

  Scenario: Creating a new invitation with system account permission
    Given a passport with system account permission
    When I create a new MemberInvitation using getNewInstance with email "invitee@example.com", message "Welcome!", and expiresAt 7 days from now
    Then the invitation email should be "invitee@example.com"
    And the invitation status should be "PENDING"

  Scenario: Creating a new invitation without permission
    Given a passport without permission to manage members or system account
    When I try to create a new MemberInvitation using getNewInstance
    Then a PermissionError should be thrown

  Scenario: Marking a pending invitation as sent with permission
    Given a MemberInvitation in PENDING status with permission to manage members
    When I call requestMarkAsSent
    Then the invitation status should be "SENT"

  Scenario: Marking a non-pending invitation as sent
    Given a MemberInvitation in ACCEPTED status with permission to manage members
    When I try to call requestMarkAsSent
    Then an error should be thrown indicating only pending invitations can be sent

  Scenario: Marking as sent without permission
    Given a MemberInvitation in PENDING status without permission to manage members
    When I try to call requestMarkAsSent
    Then an error should be thrown

  Scenario: Accepting an active invitation
    Given a MemberInvitation in SENT status with permission to manage members
    And a valid acceptedBy EndUserEntityReference with id "acceptor-456"
    When I call requestAccept with the acceptedBy reference
    Then the invitation status should be "ACCEPTED"
    And the invitation acceptedBy id should be "acceptor-456"

  Scenario: Accepting a pending invitation
    Given a MemberInvitation in PENDING status with permission to manage members
    And a valid acceptedBy EndUserEntityReference with id "acceptor-456"
    When I call requestAccept with the acceptedBy reference
    Then the invitation status should be "ACCEPTED"

  Scenario: Accepting an inactive invitation
    Given a MemberInvitation in REJECTED status with permission to manage members
    And a valid acceptedBy EndUserEntityReference with id "acceptor-456"
    When I try to call requestAccept with the acceptedBy reference
    Then an error should be thrown indicating the invitation is not active

  Scenario: Rejecting an active invitation
    Given a MemberInvitation in SENT status with permission to manage members
    When I call requestReject
    Then the invitation status should be "REJECTED"

  Scenario: Rejecting an inactive invitation
    Given a MemberInvitation in ACCEPTED status with permission to manage members
    When I try to call requestReject
    Then an error should be thrown indicating the invitation is not active

  Scenario: Marking an invitation as expired with permission
    Given a MemberInvitation in SENT status with permission to manage members
    When I call requestMarkAsExpired
    Then the invitation status should be "EXPIRED"

  Scenario: Marking as expired without permission
    Given a MemberInvitation in SENT status without permission to manage members
    When I try to call requestMarkAsExpired
    Then an error should be thrown

  Scenario: Extending expiration of an active invitation with permission
    Given a MemberInvitation in PENDING status with permission to manage members
    When I call requestExtendExpiration with a new date 14 days from now
    Then the invitation expiresAt should be updated

  Scenario: Extending expiration of an inactive invitation
    Given a MemberInvitation in ACCEPTED status with permission to manage members
    When I try to call requestExtendExpiration with a new date 14 days from now
    Then an error should be thrown indicating the invitation is not active

  Scenario: Checking isExpired when expiresAt is in the past
    Given a MemberInvitation with expiresAt in the past
    When I check isExpired
    Then isExpired should be true

  Scenario: Checking isExpired when status is EXPIRED but date is in the future
    Given a MemberInvitation in EXPIRED status with expiresAt in the future
    When I check isExpired
    Then isExpired should be true

  Scenario: Checking isActive on a pending non-expired invitation
    Given a MemberInvitation in PENDING status with a future expiresAt
    When I check isActive
    Then isActive should be true

  Scenario: Checking isActive on an expired invitation
    Given a MemberInvitation with expiresAt in the past
    When I check isActive
    Then isActive should be false
