Feature: <AggregateRoot> VendorUser

  Background:
    Given a valid Passport with vendor user permissions
    And base vendor user properties with email "alice@vendor.com", displayName "Alice Smith", externalId "123e4567-e89b-12d3-a456-426614174000", accessBlocked false, tags [], userType "vendor-user", and valid timestamps

  Scenario: Creating a new vendor user instance with restOfName
    When I create a new VendorUser aggregate using getNewUser with externalId "123e4567-e89b-12d3-a456-426614174000", lastName "Smith", and restOfName "Alice"
    Then the vendor user's externalId should be "123e4567-e89b-12d3-a456-426614174000"
    And the vendor user's displayName should be "Alice Smith"
    And a VendorUserCreatedEvent should be added to integration events

  Scenario: Creating a new vendor user instance with no restOfName
    When I create a new VendorUser aggregate using getNewUser with externalId "123e4567-e89b-12d3-a456-426614174000", lastName "Smith", and no restOfName
    Then the vendor user's displayName should be "Smith"
    And the vendor user's externalId should be "123e4567-e89b-12d3-a456-426614174000"
    And a VendorUserCreatedEvent should be added to integration events

  # email
  Scenario: Changing the email
    Given a VendorUser aggregate
    When I set the email to "bob@vendor.com"
    Then the vendor user's email should be "bob@vendor.com"

  Scenario: Changing the email to an invalid value
    Given a VendorUser aggregate
    When I try to set the email to "not-an-email"
    Then an error should be thrown indicating the email is invalid

  # displayName
  Scenario: Changing the displayName with permission to edit own account
    Given a VendorUser aggregate with permission to edit own account
    When I set the displayName to "Alice J. Smith"
    Then the vendor user's displayName should be "Alice J. Smith"

  Scenario: Changing the displayName with permission to manage vendor users
    Given a VendorUser aggregate with permission to manage vendor users
    When I set the displayName to "Alice J. Smith"
    Then the vendor user's displayName should be "Alice J. Smith"

  Scenario: Changing the displayName without permission
    Given a VendorUser aggregate without permission to manage vendor users or edit own account
    When I try to set the displayName to "Alice J. Smith"
    Then a PermissionError should be thrown

  Scenario: Changing the displayName to an invalid value
    Given a VendorUser aggregate with permission to manage vendor users or edit own account
    When I try to set the displayName to an invalid value (e.g., empty string)
    Then an error should be thrown indicating the value is invalid

  # externalId
  Scenario: Changing the externalId with permission to manage vendor users
    Given a VendorUser aggregate with permission to manage vendor users
    When I set the externalId to "123e4567-e89b-12d3-a456-426614174001"
    Then the vendor user's externalId should be "123e4567-e89b-12d3-a456-426614174001"

  Scenario: Changing the externalId without permission to manage vendor users
    Given a VendorUser aggregate without permission to manage vendor users
    When I try to set the externalId to "123e4567-e89b-12d3-a456-426614174001"
    Then an error should be thrown indicating unauthorized

  Scenario: Changing the externalId to an invalid value
    Given a VendorUser aggregate with permission to manage vendor users
    When I try to set the externalId to an invalid value
    Then an error should be thrown indicating the value is invalid

  # accessBlocked
  Scenario: Changing accessBlocked with permission to manage vendor users
    Given a VendorUser aggregate with permission to manage vendor users
    When I set accessBlocked to true
    Then the vendor user's accessBlocked should be true

  Scenario: Changing accessBlocked without permission to manage vendor users
    Given a VendorUser aggregate without permission to manage vendor users
    When I try to set accessBlocked to true
    Then an error should be thrown indicating unauthorized

  # tags
  Scenario: Changing tags with permission to manage vendor users
    Given a VendorUser aggregate with permission to manage vendor users
    When I set tags to ["tag1", "tag2"]
    Then the vendor user's tags should be ["tag1", "tag2"]

  Scenario: Changing tags without permission to manage vendor users
    Given a VendorUser aggregate without permission to manage vendor users
    When I try to set tags to ["tag1", "tag2"]
    Then an error should be thrown indicating unauthorized

  # read-only properties
  Scenario: Getting userType, createdAt, updatedAt, and schemaVersion
    Given a VendorUser aggregate
    Then the userType property should return the correct type
    And the createdAt property should return the correct date
    And the updatedAt property should return the correct date
    And the schemaVersion property should return the correct version