Feature: <ValueObject> Community Value Objects

  # name
  Scenario: Creating a name with valid value
    When I create a name with "Cellix Community"
    Then the value should be "Cellix Community"

  Scenario: Creating a name with leading and trailing whitespace
    When I create a name with "  Cellix Community  "
    Then the value should be "Cellix Community"

  Scenario: Creating a name with maximum allowed length
    When I create a name with a string of 200 characters
    Then the value should be the 200 character string

  Scenario: Creating a name with more than maximum allowed length
    When I try to create a name with a string of 201 characters
    Then an error should be thrown indicating the name is too long

  Scenario: Creating a name with minimum allowed length
    When I create a name with a string of 1 character
    Then the value should be the 1 character string

  Scenario: Creating a name with less than minimum allowed length
    When I try to create a name with an empty string
    Then an error should be thrown indicating the name is too short

  Scenario: Creating a name with null
    When I try to create a name with null
    Then an error should be thrown indicating the name is invalid

  Scenario: Creating a name with undefined
    When I try to create a name with undefined
    Then an error should be thrown indicating the name is invalid

  # domain
  Scenario: Creating a domain with valid value
    When I create a domain with "cellix.com"
    Then the value should be "cellix.com"

  Scenario: Creating a domain with leading and trailing whitespace
    When I create a domain with "  cellix.com  "
    Then the value should be "cellix.com"

  Scenario: Creating a domain with maximum allowed length
    When I create a domain with a string of 500 characters
    Then the value should be the 500 character string

  Scenario: Creating a domain with more than maximum allowed length
    When I try to create a domain with a string of 501 characters
    Then an error should be thrown indicating the domain is too long

  Scenario: Creating a domain with minimum allowed length
    When I create a domain with a string of 1 character
    Then the value should be the 1 character string

  Scenario: Creating a domain with less than minimum allowed length
    When I try to create a domain with an empty string
    Then an error should be thrown indicating the domain is too short

  Scenario: Creating a domain with null
    When I try to create a domain with null
    Then an error should be thrown indicating the domain is invalid

  Scenario: Creating a domain with undefined
    When I try to create a domain with undefined
    Then an error should be thrown indicating the domain is invalid

  # white label domain
  Scenario: Creating a white label domain with valid value
    When I create a white label domain with "whitelabel.cellix.com"
    Then the value should be "whitelabel.cellix.com"

  Scenario: Creating a white label domain with leading and trailing whitespace
    When I create a white label domain with "  whitelabel.cellix.com  "
    Then the value should be "whitelabel.cellix.com"

  Scenario: Creating a white label domain with maximum allowed length
    When I create a white label domain with a string of 500 characters
    Then the value should be the 500 character string

  Scenario: Creating a white label domain with more than maximum allowed length
    When I try to create a white label domain with a string of 501 characters
    Then an error should be thrown indicating the white label domain is too long

  Scenario: Creating a white label domain with minimum allowed length
    When I create a white label domain with a string of 1 character
    Then the value should be the 1 character string

  Scenario: Creating a white label domain with less than minimum allowed length
    When I try to create a white label domain with an empty string
    Then an error should be thrown indicating the white label domain is too short

  Scenario: Creating a white label domain with null
    When I create a white label domain with null
    Then the value should be null

  Scenario: Creating a white label domain with undefined
    When I try to create a white label domain with undefined
    Then an error should be thrown indicating the white label domain is invalid

  # handle
  Scenario: Creating a handle with valid value
    When I create a handle with "cellix"
    Then the value should be "cellix"

  Scenario: Creating a handle with leading and trailing whitespace
    When I create a handle with "  cellix  "
    Then the value should be "cellix"

  Scenario: Creating a handle with maximum allowed length
    When I create a handle with a string of 50 characters
    Then the value should be the 50 character string

  Scenario: Creating a handle with more than maximum allowed length
    When I try to create a handle with a string of 51 characters
    Then an error should be thrown indicating the handle is too long

  Scenario: Creating a handle with minimum allowed length
    When I create a handle with a string of 1 character
    Then the value should be the 1 character string

  Scenario: Creating a handle with less than minimum allowed length
    When I try to create a handle with an empty string
    Then an error should be thrown indicating the handle is too short

  Scenario: Creating a handle with null
    When I create a handle with null
    Then the value should be null

  Scenario: Creating a handle with undefined
    When I try to create a handle with undefined
    Then an error should be thrown indicating the handle is invalid