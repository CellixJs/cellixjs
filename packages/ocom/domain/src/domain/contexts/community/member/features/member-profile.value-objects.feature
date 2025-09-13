Feature: <ValueObject> MemberProfile Value Objects

  # Name
  Scenario: Creating a name with valid value
    When I create a name with "Alice"
    Then the value should be "Alice"

  Scenario: Creating a name with leading and trailing whitespace
    When I create a name with "  Alice  "
    Then the value should be "Alice"

  Scenario: Creating a name with maximum allowed length
    When I create a name with a string of 500 characters
    Then the value should be the 500 character string

  Scenario: Creating a name with more than maximum allowed length
    When I try to create a name with a string of 501 characters
    Then an error should be thrown indicating the name is too long

  Scenario: Creating a name with less than minimum allowed length
    When I try to create a name with an empty string
    Then an error should be thrown indicating the name is too short

  Scenario: Creating a name with null
    When I try to create a name with null
    Then an error should be thrown indicating the name is invalid

  Scenario: Creating a name with undefined
    When I try to create a name with undefined
    Then an error should be thrown indicating the name is invalid

  # Bio
  Scenario: Creating a bio with valid value
    When I create a bio with "Hello, this is my bio."
    Then the value should be "Hello, this is my bio."

  Scenario: Creating a bio with leading and trailing whitespace
    When I create a bio with "  Hello, this is my bio.  "
    Then the value should be "Hello, this is my bio."

  Scenario: Creating a bio with maximum allowed length
    When I create a bio with a string of 2000 characters
    Then the value should be the 2000 character string

  Scenario: Creating a bio with more than maximum allowed length
    When I try to create a bio with a string of 2001 characters
    Then an error should be thrown indicating the bio is too long

  Scenario: Creating a bio with less than minimum allowed length
    When I try to create a bio with an empty string
    Then the value should be ""

  Scenario: Creating a bio with null
    When I try to create a bio with null
    Then an error should be thrown indicating the bio is invalid

  Scenario: Creating a bio with undefined
    When I try to create a bio with undefined
    Then an error should be thrown indicating the bio is invalid

  # Interests
  Scenario: Creating interests with valid values
    When I create interests with ["reading", "sports"]
    Then the value should be ["reading", "sports"]

  Scenario: Creating interests with a single valid value
    When I create interests with ["reading"]
    Then the value should be ["reading"]

  Scenario: Creating interests with maximum allowed items
    When I create interests with an array of 20 valid strings
    Then the value should be the 20 string array

  Scenario: Creating interests with more than maximum allowed items
    When I try to create interests with an array of 21 valid strings
    Then an error should be thrown indicating the interests are too long

  Scenario: Creating interests with an item that is too long
    When I try to create interests with ["a".repeat(41)]
    Then an error should be thrown indicating the interest is too long

  Scenario: Creating interests with an empty array
    When I create interests with an empty array
    Then the value should be []

  Scenario: Creating interests with null
    When I try to create interests with null
    Then an error should be thrown indicating the interests are invalid

  Scenario: Creating interests with undefined
    When I try to create interests with undefined
    Then an error should be thrown indicating the interests are invalid
