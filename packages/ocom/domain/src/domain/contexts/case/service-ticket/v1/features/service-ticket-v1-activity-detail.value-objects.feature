Feature: ServiceTicketV1ActivityDetail Value Objects

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

  Scenario: Creating an activity type code with valid value "CREATED"
    When I create an activity type code with "CREATED"
    Then the value should be "CREATED"

  Scenario: Creating an activity type code with valid value "SUBMITTED"
    When I create an activity type code with "SUBMITTED"
    Then the value should be "SUBMITTED"

  Scenario: Creating an activity type code with valid value "ASSIGNED"
    When I create an activity type code with "ASSIGNED"
    Then the value should be "ASSIGNED"

  Scenario: Creating an activity type code with valid value "UPDATED"
    When I create an activity type code with "UPDATED"
    Then the value should be "UPDATED"

  Scenario: Creating an activity type code with valid value "INPROGRESS"
    When I create an activity type code with "INPROGRESS"
    Then the value should be "INPROGRESS"

  Scenario: Creating an activity type code with valid value "COMPLETED"
    When I create an activity type code with "COMPLETED"
    Then the value should be "COMPLETED"

  Scenario: Creating an activity type code with valid value "CLOSED"
    When I create an activity type code with "CLOSED"
    Then the value should be "CLOSED"

  Scenario: Creating an activity type code with invalid value
    When I try to create an activity type code with "INVALID"
    Then an error should be thrown indicating the activity type code is invalid

  Scenario: Creating an activity type code with null
    When I try to create an activity type code with null
    Then an error should be thrown indicating the activity type code is invalid

  Scenario: Creating an activity type code with undefined
    When I try to create an activity type code with undefined
    Then an error should be thrown indicating the activity type code is invalid