Feature: Violation Ticket V1 Value Objects

  # title
  Scenario: Creating a title with valid value
    When I create a title with "Valid Title"
    Then the value should be "Valid Title"

  Scenario: Creating a title with leading and trailing whitespace
    When I create a title with "  Valid Title  "
    Then the value should be "Valid Title"

  Scenario: Creating a title with maximum allowed length
    When I create a title with a string of 200 characters
    Then the value should be the 200 character string

  Scenario: Creating a title with more than maximum allowed length
    When I try to create a title with a string of 201 characters
    Then an error should be thrown indicating the title is too long

  Scenario: Creating a title with minimum allowed length
    When I create a title with a string of 5 characters
    Then the value should be the 5 character string

  Scenario: Creating a title with less than minimum allowed length
    When I try to create a title with a string of 4 characters
    Then an error should be thrown indicating the title is too short

  Scenario: Creating a title with null
    When I try to create a title with null
    Then an error should be thrown indicating the title is invalid

  Scenario: Creating a title with undefined
    When I try to create a title with undefined
    Then an error should be thrown indicating the title is invalid

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

  # status code
  Scenario: Creating a status code with valid value
    When I create a status code with "DRAFT"
    Then the value should be "DRAFT"

  Scenario: Creating a status code with invalid value
    When I try to create a status code with "INVALID"
    Then an error should be thrown indicating the status code is invalid

  Scenario: Creating a status code with null
    When I try to create a status code with null
    Then an error should be thrown indicating the status code is invalid

  Scenario: Creating a status code with undefined
    When I try to create a status code with undefined
    Then an error should be thrown indicating the status code is invalid

  # priority
  Scenario: Creating a priority with valid value
    When I create a priority with 3
    Then the value should be 3

  Scenario: Creating a priority with minimum allowed value
    When I create a priority with 1
    Then the value should be 1

  Scenario: Creating a priority with maximum allowed value
    When I create a priority with 5
    Then the value should be 5

  Scenario: Creating a priority with less than minimum allowed value
    When I try to create a priority with 0
    Then an error should be thrown indicating the priority is too low

  Scenario: Creating a priority with more than maximum allowed value
    When I try to create a priority with 6
    Then an error should be thrown indicating the priority is too high

  Scenario: Creating a priority with null
    When I try to create a priority with null
    Then an error should be thrown indicating the priority is invalid

  Scenario: Creating a priority with undefined
    When I try to create a priority with undefined
    Then an error should be thrown indicating the priority is invalid