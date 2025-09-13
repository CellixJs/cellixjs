Feature: <ValueObject> VendorUserRole Value Objects

  # RoleName
  Scenario: Creating a role name with valid value
    When I create a role name with "Support"
    Then the value should be "Support"

  Scenario: Creating a role name with leading and trailing whitespace
    When I create a role name with "  Support  "
    Then the value should be "Support"

  Scenario: Creating a role name with maximum allowed length
    When I create a role name with a string of 50 characters
    Then the value should be the 50 character string

  Scenario: Creating a role name with more than maximum allowed length
    When I try to create a role name with a string of 51 characters
    Then an error should be thrown indicating the role name is too long

  Scenario: Creating a role name with minimum allowed length
    When I create a role name with a string of 1 character
    Then the value should be the 1 character string

  Scenario: Creating a role name with less than minimum allowed length
    When I try to create a role name with an empty string
    Then an error should be thrown indicating the role name is too short

  Scenario: Creating a role name with null
    When I try to create a role name with null
    Then an error should be thrown indicating the wrong type was used

  Scenario: Creating a role name with undefined
    When I try to create a role name with undefined
    Then an error should be thrown indicating the wrong type was used
