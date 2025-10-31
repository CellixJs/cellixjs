Feature: Violation Ticket V1 Activity Detail Value Objects

  # description
  Scenario: Creating a description with valid value
    When I create a description with "Valid description"
    Then the value should be "Valid description"

  Scenario: Creating a description with leading and trailing whitespace
    When I create a description with "  Valid description  "
    Then the value should be "Valid description"

  Scenario: Creating a description with maximum allowed length
    When I create a description with a string of 2000 characters
    Then the value should be the 2000 character string

  Scenario: Creating a description with more than maximum allowed length
    When I try to create a description with a string of 2001 characters
    Then an error should be thrown indicating the description is too long

  Scenario: Creating a description with null
    When I try to create a description with null
    Then an error should be thrown indicating the description is invalid

  Scenario: Creating a description with undefined
    When I try to create a description with undefined
    Then an error should be thrown indicating the description is invalid

  # activity type code
  Scenario: Creating an activity type code with valid value
    When I create an activity type code with "CREATED"
    Then the value should be "CREATED"

  Scenario: Creating an activity type code with invalid value
    When I try to create an activity type code with "INVALID"
    Then an error should be thrown indicating the activity type code is invalid

  Scenario: Creating an activity type code with null
    When I try to create an activity type code with null
    Then an error should be thrown indicating the activity type code is invalid

  Scenario: Creating an activity type code with undefined
    When I try to create an activity type code with undefined
    Then an error should be thrown indicating the activity type code is invalid