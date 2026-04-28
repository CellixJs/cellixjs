Feature: <ValueObject> MemberInvitation Value Objects

  # InvitationEmail
  Scenario: Creating a valid invitation email
    When I create an InvitationEmail with "alice@example.com"
    Then the value should be "alice@example.com"

  Scenario: Creating an invitation email normalizes to lowercase
    When I create an InvitationEmail with "Alice@Example.COM"
    Then the normalizedValue should be "alice@example.com"

  Scenario: Creating an invitation email with maximum allowed length
    When I create an InvitationEmail with a valid 254-character email address
    Then the email should be created successfully

  Scenario: Creating an invitation email that exceeds maximum length
    When I try to create an InvitationEmail with a string longer than 254 characters
    Then an error should be thrown

  Scenario: Creating an invitation email with invalid format
    When I try to create an InvitationEmail with "not-an-email"
    Then an error should be thrown indicating invalid email format

  Scenario: Creating an invitation email with empty string
    When I try to create an InvitationEmail with an empty string
    Then an error should be thrown

  # InvitationMessage
  Scenario: Creating a valid invitation message
    When I create an InvitationMessage with "Welcome to our community!"
    Then the value should be "Welcome to our community!"

  Scenario: Creating an invitation message with empty string
    When I create an InvitationMessage with an empty string
    Then the message value should be empty

  Scenario: Creating an invitation message with maximum allowed length
    When I create an InvitationMessage with a string of 1000 characters
    Then the message should be created successfully

  Scenario: Creating an invitation message exceeding maximum length
    When I try to create an InvitationMessage with a string of 1001 characters
    Then an error should be thrown

  Scenario: Creating an invitation message trims whitespace
    When I create an InvitationMessage with "  hello  "
    Then the value should be "hello"

  # InvitationStatus
  Scenario: Creating a PENDING status
    When I create an InvitationStatus with "PENDING"
    Then the value should be "PENDING"
    And isPending should be true
    And isActive should be true

  Scenario: Creating a SENT status
    When I create an InvitationStatus with "SENT"
    Then the value should be "SENT"
    And isSent should be true
    And isActive should be true

  Scenario: Creating an ACCEPTED status
    When I create an InvitationStatus with "ACCEPTED"
    Then the value should be "ACCEPTED"
    And isAccepted should be true
    And isActive should be false

  Scenario: Creating a REJECTED status
    When I create an InvitationStatus with "REJECTED"
    Then the value should be "REJECTED"
    And isRejected should be true
    And isActive should be false

  Scenario: Creating an EXPIRED status
    When I create an InvitationStatus with "EXPIRED"
    Then the value should be "EXPIRED"
    And isExpired should be true
    And isActive should be false

  Scenario: Creating a status with lowercase input normalizes to uppercase
    When I create an InvitationStatus with "pending"
    Then the value should be "PENDING"

  Scenario: Creating a status with invalid value
    When I try to create an InvitationStatus with "INVALID_STATUS"
    Then an error should be thrown indicating invalid status

  # InvitationExpiresAt
  Scenario: Creating an expiration date in the future
    When I create an InvitationExpiresAt with a date 7 days from now
    Then the expiration date should be created successfully

  Scenario: Creating an expiration date in the past
    When I try to create an InvitationExpiresAt with a date in the past
    Then an error should be thrown indicating the date must be in the future

  Scenario: Checking isExpired on a future date
    When I create an InvitationExpiresAt with a date 7 days from now
    Then isExpired should be false

  Scenario: Getting daysUntilExpiration for a future date
    When I create an InvitationExpiresAt with a date exactly 7 days from now
    Then daysUntilExpiration should be 7
