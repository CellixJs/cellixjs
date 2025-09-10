Feature: <AggregateRoot> EndUser

  Background:
    Given a valid Passport with end user permissions
    And base end user properties with email "alice@cellix.com", displayName "Alice Smith", externalId "123e4567-e89b-12d3-a456-426614174000", accessBlocked false, tags [], userType "end-user", and valid timestamps

  Scenario: Creating a new end user instance with restOfName
    When I create a new EndUser aggregate using getNewInstance with externalId "123e4567-e89b-12d3-a456-426614174000", lastName "Smith", restOfName "Alice", and email "alice@cellix.com"
    Then the end user's externalId should be "123e4567-e89b-12d3-a456-426614174000"
    And the end user's displayName should be "Alice Smith"
    And a EndUserCreatedEvent should be added to integration events

  Scenario: Creating a new end user instance with no restOfName
    When I create a new EndUser aggregate using getNewInstance with externalId "123e4567-e89b-12d3-a456-426614174000", lastName "Smith", restOfName "", and email "alice@cellix.com"
    Then the end user's displayName should be "Smith"
    And the end user's externalId should be "123e4567-e89b-12d3-a456-426614174000"
    And a EndUserCreatedEvent should be added to integration events

  # email
  Scenario: Changing the email with permission
    Given an EndUser aggregate with permission to edit own account
    When I set the email to "bob@cellix.com"
    Then the end user's email should be "bob@cellix.com"

  Scenario: Changing the email without permission
    Given an EndUser aggregate without permission to edit own account or manage end users
    When I try to set the email to "bob@cellix.com"
    Then a PermissionError should be thrown

  Scenario: Changing the email to an invalid email address
    Given an EndUser aggregate with permission to edit own account
    When I try to set the email to "not-an-email"
    Then an error should be thrown indicating the email is invalid

  # displayName
  Scenario: Changing the displayName with permission
    Given an EndUser aggregate with permission to edit own account
    When I set the displayName to "Alice J. Smith"
    Then the end user's displayName should be "Alice J. Smith"

  Scenario: Changing the displayName without permission
    Given an EndUser aggregate without permission to edit own account or manage end users
    When I try to set the displayName to "Alice J. Smith"
    Then a PermissionError should be thrown

  Scenario: Changing the displayName to an invalid value
    Given an EndUser aggregate with permission to edit own account
    When I try to set the displayName to an empty string
    Then an error should be thrown indicating the displayName is too short

  # externalId
  Scenario: Setting the externalId during creation
    Given valid dependencies for a new EndUser aggregate
    When I set the externalId to "123e4567-e89b-12d3-a456-426614174001" during creation
    Then the end user's externalId should be "123e4567-e89b-12d3-a456-426614174001"

  Scenario: Providing an invalid externalId during creation
    Given valid dependencies for a new EndUser aggregate
    When I try to create a new EndUser with an invalid externalId
    Then an error should be thrown indicating the externalId is invalid

  Scenario: Changing the externalId after creation
    Given an existing EndUser aggregate
    When I try to set the externalId to "123e4567-e89b-12d3-a456-426614174002" after creation
    Then an error should be thrown indicating personal information cannot be set

  # accessBlocked
  Scenario: Changing accessBlocked with elevated permission
    Given an EndUser aggregate with permission to manage end users
    When I set accessBlocked to true
    Then the end user's accessBlocked should be true

  Scenario: Changing accessBlocked without elevated permission
    Given an EndUser aggregate without permission to manage end users
    When I try to set accessBlocked to true
    Then a PermissionError should be thrown

  # tags
  Scenario: Changing tags with elevated permission
    Given an EndUser aggregate with permission to manage end users
    When I set tags to ["tag1", "tag2"]
    Then the end user's tags should be ["tag1", "tag2"]

  Scenario: Changing tags without elevated permission
    Given an EndUser aggregate without permission to manage end users
    When I try to set tags to ["tag1", "tag2"]
    Then a PermissionError should be thrown

  # read-only properties
  Scenario: Getting userType, createdAt, updatedAt, and schemaVersion
    Given an EndUser aggregate
    Then the userType property should return the correct type
    And the createdAt property should return the correct date
    And the updatedAt property should return the correct date
    And the schemaVersion property should return the correct version
