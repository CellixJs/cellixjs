Feature: <ValueObject> MemberAccount Value Objects

  # FirstName
  Scenario: Creating a first name with valid value
    When I create a first name with "Alice"
    Then the value should be "Alice"

  Scenario: Creating a first name with leading and trailing whitespace
    When I create a first name with "  Alice  "
    Then the value should be "Alice"

  Scenario: Creating a first name with maximum allowed length
    When I create a first name with a string of 500 characters
    Then the value should be the 500 character string

  Scenario: Creating a first name with more than maximum allowed length
    When I try to create a first name with a string of 501 characters
    Then an error should be thrown indicating the first name is too long

  Scenario: Creating a first name with less than minimum allowed length
    When I try to create a first name with an empty string
    Then an error should be thrown indicating the first name is too short

  Scenario: Creating a first name with null
    When I try to create a first name with null
    Then an error should be thrown indicating the first name is invalid

  Scenario: Creating a first name with undefined
    When I try to create a first name with undefined
    Then an error should be thrown indicating the first name is invalid

  # LastName
  Scenario: Creating a last name with valid value
    When I create a last name with "Smith"
    Then the value should be "Smith"

  Scenario: Creating a last name with leading and trailing whitespace
    When I create a last name with "  Smith  "
    Then the value should be "Smith"

  Scenario: Creating a last name with maximum allowed length
    When I create a last name with a string of 500 characters
    Then the value should be the 500 character string

  Scenario: Creating a last name with more than maximum allowed length
    When I try to create a last name with a string of 501 characters
    Then an error should be thrown indicating the last name is too long

  Scenario: Creating a last name with less than minimum allowed length
    When I try to create a last name with an empty string
    Then an error should be thrown indicating the last name is too short

  Scenario: Creating a last name with null
    When I try to create a last name with null
    Then an error should be thrown indicating the last name is invalid

  Scenario: Creating a last name with undefined
    When I try to create a last name with undefined
    Then an error should be thrown indicating the last name is invalid

  # AccountStatusCode
  Scenario Outline: Creating an account status code with valid value
    When I create an account status code with "<statusCode>"
    Then the value should be "<statusCode>"

    Examples:
        | statusCode |
        | CREATED    |
        | ACCEPTED   |
        | REJECTED   |

  Scenario: Creating an account status code with an invalid value
    When I try to create an account status code with "INVALID"
    Then an error should be thrown indicating the account status code is invalid

  Scenario: Creating an account status code with null
    When I try to create an account status code with null
    Then an error should be thrown indicating the account status code is invalid

  Scenario: Creating an account status code with undefined
    When I try to create an account status code with undefined
    Then an error should be thrown indicating the account status code is invalid
