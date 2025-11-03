Feature: <ValueObject> Property Value Objects

  # PropertyName
  Scenario: Creating a property name with valid value
    When I create a property name with "Test Property"
    Then the value should be "Test Property"

  Scenario: Creating a property name with leading and trailing whitespace
    When I create a property name with "  Test Property  "
    Then the value should be "Test Property"

  Scenario: Creating a property name with maximum allowed length
    When I create a property name with a string of 100 characters
    Then the value should be the 100 character string

  Scenario: Creating a property name with more than maximum allowed length
    When I try to create a property name with a string of 101 characters
    Then an error should be thrown indicating the property name is too long

  Scenario: Creating a property name with minimum allowed length
    When I create a property name with a string of 1 character
    Then the value should be the 1 character string

  Scenario: Creating a property name with less than minimum allowed length
    When I try to create a property name with an empty string
    Then an error should be thrown indicating the property name is too short

  Scenario: Creating a property name with null
    When I try to create a property name with null
    Then an error should be thrown indicating the property name is invalid

  Scenario: Creating a property name with undefined
    When I try to create a property name with undefined
    Then an error should be thrown indicating the property name is invalid

  # PropertyType
  Scenario: Creating a property type with valid value
    When I create a property type with "House"
    Then the value should be "House"

  Scenario: Creating a property type with leading and trailing whitespace
    When I create a property type with "  Apartment  "
    Then the value should be "Apartment"

  Scenario: Creating a property type with maximum allowed length
    When I create a property type with a string of 100 characters
    Then the value should be the 100 character string

  Scenario: Creating a property type with more than maximum allowed length
    When I try to create a property type with a string of 101 characters
    Then an error should be thrown indicating the property type is too long

  Scenario: Creating a property type with minimum allowed length
    When I create a property type with a string of 1 character
    Then the value should be the 1 character string

  Scenario: Creating a property type with less than minimum allowed length
    When I try to create a property type with an empty string
    Then an error should be thrown indicating the property type is too short

  Scenario: Creating a property type with null
    When I try to create a property type with null
    Then an error should be thrown indicating the property type is invalid

  Scenario: Creating a property type with undefined
    When I try to create a property type with undefined
    Then an error should be thrown indicating the property type is invalid