Feature: <AggregateRoot> StaffUser

  Background:
    Given a valid Passport with staff user permissions
    And base staff user properties with firstName "Alice", lastName "Smith", email "alice@cellix.com", displayName "Alice Smith", externalId "123e4567-e89b-12d3-a456-426614174000", accessBlocked false, tags [], userType "staff", and valid timestamps

  Scenario: Creating a new staff user instance
    When I create a new StaffUser aggregate using getNewUser with firstName "Alice", lastName "Smith", email "alice@cellix.com", and externalId "123e4567-e89b-12d3-a456-426614174000"
    Then the staff user's firstName should be "Alice"
    And the staff user's lastName should be "Smith"
    And the staff user's email should be "alice@cellix.com"
    And the staff user's displayName should be "Alice Smith"
    And the staff user's externalId should be "123e4567-e89b-12d3-a456-426614174000"
    And a StaffUserCreatedEvent should be added to integration events

  # firstName
  Scenario: Changing the firstName with permission
    Given a StaffUser aggregate with permission to manage staff roles and permissions
    When I set the firstName to "Bob"
    Then the staff user's firstName should be "Bob"

  Scenario: Changing the firstName without permission
    Given a StaffUser aggregate without permission to manage staff roles and permissions
    When I try to set the firstName to "Bob"
    Then a PermissionError should be thrown

  Scenario: Changing the firstName to an invalid value
    Given a StaffUser aggregate with permission to manage staff roles and permissions
    When I try to set the firstName to an invalid value (e.g., null or empty string)
    Then an error should be thrown indicating the value is invalid

  # lastName
  Scenario: Changing the lastName with permission
    Given a StaffUser aggregate with permission to manage staff roles and permissions
    When I set the lastName to "Johnson"
    Then the staff user's lastName should be "Johnson"

  Scenario: Changing the lastName without permission
    Given a StaffUser aggregate without permission to manage staff roles and permissions
    When I try to set the lastName to "Johnson"
    Then a PermissionError should be thrown

  Scenario: Changing the lastName to an invalid value
    Given a StaffUser aggregate with permission to manage staff roles and permissions
    When I try to set the lastName to an invalid value (e.g., null or empty string)
    Then an error should be thrown indicating the value is invalid

  # displayName
  Scenario: Changing the displayName with permission
    Given a StaffUser aggregate with permission to manage staff roles and permissions
    When I set the displayName to "Alice J. Smith"
    Then the staff user's displayName should be "Alice J. Smith"

  Scenario: Changing the displayName without permission
    Given a StaffUser aggregate without permission to manage staff roles and permissions
    When I try to set the displayName to "Alice J. Smith"
    Then a PermissionError should be thrown

  Scenario: Changing the displayName to an invalid value
    Given a StaffUser aggregate with permission to manage staff roles and permissions
    When I try to set the displayName to an invalid value (e.g., null or empty string)
    Then an error should be thrown indicating the value is invalid

  # email
  Scenario: Changing the email with permission
    Given a StaffUser aggregate with permission to manage staff roles and permissions
    When I set the email to "bob@cellix.com"
    Then the staff user's email should be "bob@cellix.com"

  Scenario: Changing the email without permission
    Given a StaffUser aggregate without permission to manage staff roles and permissions
    When I try to set the email to "bob@cellix.com"
    Then a PermissionError should be thrown

  Scenario: Changing the email to an invalid value
    Given a StaffUser aggregate with permission to manage staff roles and permissions
    When I try to set the email to "not-an-email"
    Then an error should be thrown indicating the value is invalid

  # externalId
  Scenario: Changing the externalId with permission
    Given a StaffUser aggregate with permission to manage staff roles and permissions
    When I set the externalId to "123e4567-e89b-12d3-a456-426614174000"
    Then the staff user's externalId should be "123e4567-e89b-12d3-a456-426614174000"

  Scenario: Changing the externalId without permission
    Given a StaffUser aggregate without permission to manage staff roles and permissions
    When I try to set the externalId to "123e4567-e89b-12d3-a456-426614174000"
    Then a PermissionError should be thrown

  Scenario: Changing the externalId to an invalid value
    Given a StaffUser aggregate with permission to manage staff roles and permissions
    When I try to set the externalId to an invalid value
    Then an error should be thrown indicating the value is invalid

  # accessBlocked
  Scenario: Changing accessBlocked with permission
    Given a StaffUser aggregate with permission to manage staff roles and permissions
    When I set accessBlocked to true
    Then the staff user's accessBlocked should be true

  Scenario: Changing accessBlocked without permission
    Given a StaffUser aggregate without permission to manage staff roles and permissions
    When I try to set accessBlocked to true
    Then a PermissionError should be thrown

  # tags
  Scenario: Changing tags with permission
    Given a StaffUser aggregate with permission to manage staff roles and permissions
    When I set tags to ["admin", "support"]
    Then the staff user's tags should be ["admin", "support"]

  Scenario: Changing tags without permission
    Given a StaffUser aggregate without permission to manage staff roles and permissions
    When I try to set tags to ["admin", "support"]
    Then a PermissionError should be thrown

  # role
  Scenario: Changing the role with permission
    Given a StaffUser aggregate with permission to manage staff roles and permissions
    When I set the role to a valid staff role
    Then the staff user's role should be updated

  Scenario: Changing the role without permission
    Given a StaffUser aggregate without permission to manage staff roles and permissions
    When I try to set the role to a valid staff role
    Then a PermissionError should be thrown

  Scenario: Clearing the role with permission
    Given a StaffUser aggregate with permission to manage staff roles and permissions
    When I clear the role
    Then the staff user's role should be undefined

  # read-only properties
  Scenario: Getting userType, createdAt, updatedAt, and schemaVersion
    Given a StaffUser aggregate
    Then the userType property should return the correct type
    And the createdAt property should return the correct date
    And the updatedAt property should return the correct date
    And the schemaVersion property should return the correct version
