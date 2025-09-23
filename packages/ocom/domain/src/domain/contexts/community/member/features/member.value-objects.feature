Feature: <ValueObject> Member Value Objects

  # MemberName
  Scenario: Creating a member name with valid value
    When I create a member name with "Alice"
    Then the value should be "Alice"

  Scenario: Creating a member name with leading and trailing whitespace
    When I create a member name with "  Alice  "
    Then the value should be "Alice"

  Scenario: Creating a member name with maximum allowed length
    When I create a member name with a string of 200 characters
    Then the value should be the 200 character string

  Scenario: Creating a member name with more than maximum allowed length
    When I try to create a member name with a string of 201 characters
    Then an error should be thrown indicating the member name is too long

  Scenario: Creating a member name with minimum allowed length
    When I create a member name with a string of 1 character
    Then the value should be the 1 character string

  Scenario: Creating a member name with less than minimum allowed length
    When I try to create a member name with an empty string
    Then an error should be thrown indicating the member name is too short

  Scenario: Creating a member name with null
    When I try to create a member name with null
    Then an error should be thrown indicating the member name is invalid

  Scenario: Creating a member name with undefined
    When I try to create a member name with undefined
    Then an error should be thrown indicating the member name is invalid

  # CyberSourceCustomerId
  Scenario: Creating a CyberSourceCustomerId with valid value
    When I create a CyberSourceCustomerId with "cs_123"
    Then the value should be "cs_123"

  Scenario: Creating a CyberSourceCustomerId with maximum allowed length
    When I create a CyberSourceCustomerId with a string of 50 characters
    Then the value should be the 50 character string

  Scenario: Creating a CyberSourceCustomerId with more than maximum allowed length
    When I try to create a CyberSourceCustomerId with a string of 51 characters
    Then an error should be thrown indicating the CyberSourceCustomerId is too long

  Scenario: Creating a CyberSourceCustomerId with minimum allowed length
    When I create a CyberSourceCustomerId with a string of 1 character
    Then the value should be the 1 character string

  Scenario: Creating a CyberSourceCustomerId with less than minimum allowed length
    When I try to create a CyberSourceCustomerId with an empty string
    Then an error should be thrown indicating the CyberSourceCustomerId is too short

  Scenario: Creating a CyberSourceCustomerId with null
    When I try to create a CyberSourceCustomerId with null
    Then an error should be thrown indicating the CyberSourceCustomerId is invalid

  Scenario: Creating a CyberSourceCustomerId with undefined
    When I try to create a CyberSourceCustomerId with undefined
    Then an error should be thrown indicating the CyberSourceCustomerId is invalid
