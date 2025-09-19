Feature: <ValueObject> StaffUser Value Objects

  # FirstName
  Scenario: Creating a first name with valid value
    When I create a first name with "Alice"
    Then the value should be "Alice"

  Scenario: Creating a first name with leading and trailing whitespace
    When I create a first name with "  Alice  "
    Then the value should be "Alice"

  Scenario: Creating a first name with maximum allowed length
    When I create a first name with a string of 50 characters
    Then the value should be the 50 character string

  Scenario: Creating a first name with more than maximum allowed length
    When I try to create a first name with a string of 51 characters
    Then an error should be thrown indicating the first name is too long

  Scenario: Creating a first name with an empty string
    When I try to create a first name with an empty string
    Then an error should be thrown indicating the first name is too short

  Scenario: Creating a first name with null
    When I try to create a first name with null
    Then an error should be thrown indicating the wrong type was used

  Scenario: Creating a first name with undefined
    When I try to create a first name with undefined
    Then an error should be thrown indicating the wrong type was used

  # LastName
  Scenario: Creating a last name with valid value
    When I create a last name with "Smith"
    Then the value should be "Smith"

  Scenario: Creating a last name with leading and trailing whitespace
    When I create a last name with "  Smith  "
    Then the value should be "Smith"

  Scenario: Creating a last name with maximum allowed length
    When I create a last name with a string of 50 characters
    Then the value should be the 50 character string

  Scenario: Creating a last name with more than maximum allowed length
    When I try to create a last name with a string of 51 characters
    Then an error should be thrown indicating the last name is too long

  Scenario: Creating a last name with an empty string
    When I try to create a last name with an empty string
    Then an error should be thrown indicating the last name is too short

  Scenario: Creating a last name with null
    When I try to create a last name with null
    Then an error should be thrown indicating the wrong type was used

  Scenario: Creating a last name with undefined
    When I try to create a last name with undefined
    Then an error should be thrown indicating the wrong type was used

  # DisplayName
  Scenario: Creating a display name with valid value
    When I create a display name with "Alice Smith"
    Then the value should be "Alice Smith"

  Scenario: Creating a display name with leading and trailing whitespace
    When I create a display name with "  Alice Smith  "
    Then the value should be "Alice Smith"

  Scenario: Creating a display name with maximum allowed length
    When I create a display name with a string of 100 characters
    Then the value should be the 100 character string

  Scenario: Creating a display name with more than maximum allowed length
    When I try to create a display name with a string of 101 characters
    Then an error should be thrown indicating the display name is too long

  Scenario: Creating a display name with minimum allowed length
    When I create a display name with a string of 1 character
    Then the value should be the 1 character string

  Scenario: Creating a display name with less than minimum allowed length
    When I try to create a display name with an empty string
    Then an error should be thrown indicating the display name is too short

  Scenario: Creating a display name with null
    When I try to create a display name with null
    Then an error should be thrown indicating the wrong type was used

  Scenario: Creating a display name with undefined
    When I try to create a display name with undefined
    Then an error should be thrown indicating the wrong type was used
