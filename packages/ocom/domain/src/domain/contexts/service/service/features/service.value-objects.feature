Feature: <ValueObject> Service Value Objects

  # ServiceName
  Scenario: Creating a service name with valid value
    When I create a service name with "Test Service"
    Then the value should be "Test Service"

  Scenario: Creating a service name with leading and trailing whitespace
    When I create a service name with "  Test Service  "
    Then the value should be "Test Service"

  Scenario: Creating a service name with maximum allowed length
    When I create a service name with a string of 100 characters
    Then the value should be the 100 character string

  Scenario: Creating a service name with more than maximum allowed length
    When I try to create a service name with a string of 101 characters
    Then an error should be thrown indicating the service name is too long

  Scenario: Creating a service name with minimum allowed length
    When I create a service name with a string of 3 characters
    Then the value should be the 3 character string

  Scenario: Creating a service name with less than minimum allowed length
    When I try to create a service name with a string of 2 characters
    Then an error should be thrown indicating the service name is too short

  Scenario: Creating a service name with null
    When I try to create a service name with null
    Then an error should be thrown indicating the service name is invalid

  Scenario: Creating a service name with undefined
    When I try to create a service name with undefined
    Then an error should be thrown indicating the service name is invalid

  # Description
  Scenario: Creating a description with valid value
    When I create a description with "A test service description"
    Then the value should be "A test service description"

  Scenario: Creating a description with leading and trailing whitespace
    When I create a description with "  A test service description  "
    Then the value should be "A test service description"

  Scenario: Creating a description with maximum allowed length
    When I create a description with a string of 500 characters
    Then the value should be the 500 character string

  Scenario: Creating a description with more than maximum allowed length
    When I try to create a description with a string of 501 characters
    Then an error should be thrown indicating the description is too long

  Scenario: Creating a description with minimum allowed length
    When I create a description with a string of 1 character
    Then the value should be the 1 character string

  Scenario: Creating a description with less than minimum allowed length
    When I try to create a description with an empty string
    Then an error should be thrown indicating the description is too short

  Scenario: Creating a description with null
    When I try to create a description with null
    Then an error should be thrown indicating the description is invalid

  Scenario: Creating a description with undefined
    When I try to create a description with undefined
    Then an error should be thrown indicating the description is invalid