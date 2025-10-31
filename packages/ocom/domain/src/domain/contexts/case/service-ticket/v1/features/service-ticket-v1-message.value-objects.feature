Feature: ServiceTicketV1Message Value Objects

  Scenario: Creating a message with valid value
    When I create a message with "Valid message"
    Then the value should be "Valid message"

  Scenario: Creating a message with leading and trailing whitespace
    When I create a message with "  Valid message  "
    Then the value should be "Valid message"

  Scenario: Creating a message with maximum allowed length
    When I create a message with a string of 2000 characters
    Then the value should be the 2000 character string

  Scenario: Creating a message with more than maximum allowed length
    When I try to create a message with a string of 2001 characters
    Then an error should be thrown indicating the message is too long

  Scenario: Creating a message with minimum allowed length
    When I create a message with a string of 1 character
    Then the value should be the 1 character string

  Scenario: Creating a message with less than minimum allowed length
    When I try to create a message with an empty string
    Then an error should be thrown indicating the message is too short

  Scenario: Creating a message with null
    When I try to create a message with null
    Then an error should be thrown indicating the message is invalid

  Scenario: Creating a message with undefined
    When I try to create a message with undefined
    Then an error should be thrown indicating the message is invalid

  Scenario: Creating an embedding with valid value
    When I create an embedding with "Valid embedding"
    Then the embedding value should be "Valid embedding"

  Scenario: Creating an embedding with leading and trailing whitespace
    When I create an embedding with "  Valid embedding  "
    Then the embedding value should be "Valid embedding"

  Scenario: Creating an embedding with maximum allowed length
    When I create an embedding with a string of 2000 characters
    Then the embedding value should be the 2000 character string

  Scenario: Creating an embedding with more than maximum allowed length
    When I try to create an embedding with a string of 2001 characters
    Then an error should be thrown indicating the embedding is too long

  Scenario: Creating an embedding with null
    When I try to create an embedding with null
    Then an error should be thrown indicating the embedding is invalid

  Scenario: Creating an embedding with undefined
    When I try to create an embedding with undefined
    Then an error should be thrown indicating the embedding is invalid

  Scenario: Creating a sentBy with valid value "internal"
    When I create a sentBy with "internal"
    Then the sentBy value should be "internal"

  Scenario: Creating a sentBy with valid value "external"
    When I create a sentBy with "external"
    Then the sentBy value should be "external"

  Scenario: Creating a sentBy with invalid value
    When I try to create a sentBy with "invalid"
    Then an error should be thrown indicating the sentBy is invalid

  Scenario: Creating a sentBy with null
    When I try to create a sentBy with null
    Then an error should be thrown indicating the sentBy is invalid

  Scenario: Creating a sentBy with undefined
    When I try to create a sentBy with undefined
    Then an error should be thrown indicating the sentBy is invalid