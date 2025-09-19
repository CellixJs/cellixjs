Feature: <ValueObject> MemberCustomView Value Objects

  # CustomViewName
  Scenario: Creating a custom view name with valid value
    When I create a custom view name with "My View"
    Then the value should be "My View"

  Scenario: Creating a custom view name with leading and trailing whitespace
    When I create a custom view name with "  My View  "
    Then the value should be "My View"

  Scenario: Creating a custom view name with maximum allowed length
    When I create a custom view name with a string of 500 characters
    Then the value should be the 500 character string

  Scenario: Creating a custom view name with more than maximum allowed length
    When I try to create a custom view name with a string of 501 characters
    Then an error should be thrown indicating the custom view name is too long

  Scenario: Creating a custom view name with less than minimum allowed length
    When I try to create a custom view name with an empty string
    Then the value should be ""

  Scenario: Creating a custom view name with null
    When I try to create a custom view name with null
    Then an error should be thrown indicating the custom view name is invalid

  Scenario: Creating a custom view name with undefined
    When I try to create a custom view name with undefined
    Then an error should be thrown indicating the custom view name is invalid

  # CustomViewType
  Scenario Outline: Creating a custom view type with valid value
    When I create a custom view type with "<type>"
    Then the value should be "<type>"

    Examples:
      | type           |
      | PROPERTY       |
      | SERVICE_TICKET |

  Scenario: Creating a custom view type with invalid value
    When I try to create a custom view type with "INVALID"
    Then an error should be thrown indicating the custom view type is invalid

  Scenario: Creating a custom view type with null
    When I try to create a custom view type with null
    Then an error should be thrown indicating the custom view type is invalid

  Scenario: Creating a custom view type with undefined
    When I try to create a custom view type with undefined
    Then an error should be thrown indicating the custom view type is invalid

  # CustomViewSortOrder
  Scenario: Creating a custom view sort order with valid value
    When I create a custom view sort order with "asc"
    Then the value should be "asc"

  Scenario: Creating a custom view sort order with leading and trailing whitespace
    When I create a custom view sort order with "  asc  "
    Then the value should be "asc"

  Scenario: Creating a custom view sort order with maximum allowed length
    When I create a custom view sort order with a string of 500 characters
    Then the value should be the 500 character string

  Scenario: Creating a custom view sort order with more than maximum allowed length
    When I try to create a custom view sort order with a string of 501 characters
    Then an error should be thrown indicating the custom view sort order is too long

  Scenario: Creating a custom view sort order with null
    When I try to create a custom view sort order with null
    Then an error should be thrown indicating the custom view sort order is invalid

  Scenario: Creating a custom view sort order with undefined
    When I try to create a custom view sort order with undefined
    Then an error should be thrown indicating the custom view sort order is invalid

  # CustomViewFilters
  Scenario: Creating custom view filters with valid values
    When I create custom view filters with ["active", "pending"]
    Then the value should be ["active", "pending"]

  Scenario: Creating custom view filters with a single valid value
    When I create custom view filters with ["active"]
    Then the value should be ["active"]

  Scenario: Creating custom view filters with maximum allowed items
    When I create custom view filters with an array of 100 valid strings
    Then the value should be the 100 string array

  Scenario: Creating custom view filters with more than maximum allowed items
    When I try to create custom view filters with an array of 101 valid strings
    Then an error should be thrown indicating the custom view filters are too long

  Scenario: Creating custom view filters with an item that is too long
    When I try to create custom view filters with ["a".repeat(501)]
    Then an error should be thrown indicating the custom view filter is too long

  Scenario: Creating custom view filters with an empty array
    When I create custom view filters with an empty array
    Then the value should be []

  Scenario: Creating custom view filters with null
    When I try to create custom view filters with null
    Then an error should be thrown indicating the custom view filters are invalid

  Scenario: Creating custom view filters with undefined
    When I try to create custom view filters with undefined
    Then an error should be thrown indicating the custom view filters are invalid

  # CustomViewColumnsToDisplay
  Scenario: Creating custom view columns to display with valid values
    When I create custom view columns to display with ["name", "email"]
    Then the value should be ["name", "email"]

  Scenario: Creating custom view columns to display with a single valid value
    When I create custom view columns to display with ["name"]
    Then the value should be ["name"]

  Scenario: Creating custom view columns to display with maximum allowed items
    When I create custom view columns to display with an array of 30 valid strings
    Then the value should be the 30 string array

  Scenario: Creating custom view columns to display with more than maximum allowed items
    When I try to create custom view columns to display with an array of 31 valid strings
    Then an error should be thrown indicating the custom view columns to display are too long

  Scenario: Creating custom view columns to display with an item that is too long
    When I try to create custom view columns to display with ["a".repeat(501)]
    Then an error should be thrown indicating the custom view column to display is too long

  Scenario: Creating custom view columns to display with an empty array
    When I create custom view columns to display with an empty array
    Then the value should be []

  Scenario: Creating custom view columns to display with null
    When I try to create custom view columns to display with null
    Then an error should be thrown indicating the custom view columns to display are invalid

  Scenario: Creating custom view columns to display with undefined
    When I try to create custom view columns to display with undefined
    Then an error should be thrown indicating the custom view columns to display are invalid
