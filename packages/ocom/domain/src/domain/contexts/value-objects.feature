Feature: <ValueObject> Common Value Objects

  # Email
  Scenario: Creating an email with a valid value
    When I create an email with "alice@example.com"
    Then the value should be "alice@example.com"

  Scenario: Creating an email with leading and trailing whitespace
    When I create an email with "  alice@example.com  "
    Then the value should be "alice@example.com"

  Scenario: Creating an email with maximum allowed length
    When I create an email with a string of 254 characters ending with "@e.com"
    Then the value should be the 254 character string

  Scenario: Creating an email with more than the maximum allowed length
    When I try to create an email with a string of 255 characters ending with "@e.com"
    Then an error should be thrown indicating the value is too long

  Scenario: Creating an email with an invalid value
    When I try to create an email with "not-an-email"
    Then an error should be thrown indicating the value is invalid

  Scenario: Creating an email with an empty string
    When I try to create an email with an empty string
    Then an error should be thrown indicating the value is invalid

  Scenario: Creating an email with a null value
    When I try to create an email with a null value
    Then an error should be thrown indicating the value is invalid

  Scenario: Creating an email with an undefined value
    When I try to create an email with an undefined value
    Then an error should be thrown indicating the value is invalid

  # NullableEmail
  Scenario: Creating a nullable email with a valid value
    When I create a nullable email with "bob@example.com"
    Then the value should be "bob@example.com"

    Scenario: Creating a nullable email with leading and trailing whitespace
    When I create a nullable email with "  alice@example.com  "
    Then the value should be "alice@example.com"

  Scenario: Creating a nullable email with maximum allowed length
    When I create a nullable email with a string of 254 characters ending with "@e.com"
    Then the value should be the 254 character string

  Scenario: Creating a nullable email with more than the maximum allowed length
    When I try to create a nullable email with a string of 255 characters ending with "@e.com"
    Then an error should be thrown indicating the value is too long

  Scenario: Creating a nullable email with an invalid value
    When I try to create a nullable email with "not-an-email"
    Then an error should be thrown indicating the value is invalid

  Scenario: Creating a nullable email with an empty string
    When I create a nullable email with an empty string
    Then the value should be ""

  Scenario: Creating a nullable email with a null value
    When I create a nullable email with a null value
    Then an error should be thrown indicating the value is invalid

  Scenario: Creating a nullable email with an undefined value
    When I create a nullable email with an undefined value
    Then an error should be thrown indicating the value is invalid

  # ExternalId
  Scenario: Creating an ExternalId with a valid GUID
    When I create an ExternalId with "123e4567-e89b-12d3-a456-426614174000"
    Then the value should be "123e4567-e89b-12d3-a456-426614174000"

  Scenario: Creating an ExternalId with leading and trailing whitespace
    When I create an ExternalId with "  123e4567-e89b-12d3-a456-426614174000  "
    Then the value should be "123e4567-e89b-12d3-a456-426614174000"

  Scenario: Creating an ExternalId with an invalid GUID
    When I try to create an ExternalId with a valid length string but not a valid GUID
    Then an error should be thrown indicating the value is invalid

  Scenario: Creating an ExternalId with less than 36 characters
    When I try to create an ExternalId with "short-id"
    Then an error should be thrown indicating the value is too short

  Scenario: Creating an ExternalId with more than 36 characters
    When I try to create an ExternalId with a string of 37 characters
    Then an error should be thrown indicating the value is too long
