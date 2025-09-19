Feature: <Entity> MemberAccount

  Background:
    Given valid MemberAccountProps with firstName "Alice", lastName "Smith", a valid EndUserEntityReference as user, statusCode "active", and a valid EndUserEntityReference as createdBy
    And a valid CommunityVisa
    And a valid Passport

  Scenario: Getting firstName, lastName, user, statusCode, and createdBy
    Given a MemberAccount entity
    Then the firstName property should return "Alice"
    And the lastName property should return "Smith"
    And the user property should return the provided EndUserEntityReference
    And the statusCode property should return "active"
    And the createdBy property should return the provided EndUserEntityReference

  Scenario: Changing firstName with permission to manage members
    Given a MemberAccount entity with permission to manage members
    When I set the firstName to "Bob"
    Then the firstName property should return "Bob"

  Scenario: Changing firstName with system account permission
    Given a MemberAccount entity with system account permission
    When I set the firstName to "Bob"
    Then the firstName property should return "Bob"

  Scenario: Changing firstName with permission to edit own member account
    Given a MemberAccount entity with permission to edit own member accounts and is editing own member account
    When I set the firstName to "Bob"
    Then the firstName property should return "Bob"

  Scenario: Changing firstName without permission
    Given a MemberAccount entity without permission to manage members, system account, or edit own member accounts
    When I try to set the firstName to "Bob"
    Then a PermissionError should be thrown

  Scenario: Changing firstName to an invalid value with permission to manage members
    Given a MemberAccount entity with permission to manage members
    When I try to set the firstName to an invalid value (e.g., null or empty string)
    Then an error should be thrown indicating the value is invalid

  Scenario: Changing lastName with permission to manage members
    Given a MemberAccount entity with permission to manage members
    When I set the lastName to "Johnson"
    Then the lastName property should return "Johnson"

  Scenario: Changing lastName with system account permission
    Given a MemberAccount entity with system account permission
    When I set the lastName to "Johnson"
    Then the lastName property should return "Johnson"

  Scenario: Changing lastName with permission to edit own member account
    Given a MemberAccount entity with permission to edit own member accounts and is editing own member account
    When I set the lastName to "Johnson"
    Then the lastName property should return "Johnson"

  Scenario: Changing lastName without permission
    Given a MemberAccount entity without permission to manage members, system account, or edit own member accounts
    When I try to set the lastName to "Johnson"
    Then a PermissionError should be thrown

  Scenario: Changing lastName to an invalid value with permission to manage members
    Given a MemberAccount entity with permission to manage members
    When I try to set the lastName to an invalid value (e.g., null or empty string)
    Then an error should be thrown indicating the value is invalid

  Scenario: Changing user with permission to manage members
    Given a MemberAccount entity with permission to manage members
    When I set the user to a new EndUserEntityReference
    Then the user property should return the new EndUserEntityReference

  Scenario: Changing user with system account permission
    Given a MemberAccount entity with system account permission
    When I set the user to a new EndUserEntityReference
    Then the user property should return the new EndUserEntityReference

  Scenario: Changing user with permission to edit own member account
    Given a MemberAccount entity with permission to edit own member accounts and is editing own member account
    When I set the user to a new EndUserEntityReference
    Then the user property should return the new EndUserEntityReference

  Scenario: Changing user without permission
    Given a MemberAccount entity without permission to manage members, system account, or edit own member accounts
    When I try to set the user to a new EndUserEntityReference
    Then a PermissionError should be thrown

  Scenario: Changing statusCode with permission to manage members
    Given a MemberAccount entity with permission to manage members
    When I set the statusCode to "ACCEPTED"
    Then the statusCode property should return "ACCEPTED"

  Scenario: Changing statusCode with system account permission
    Given a MemberAccount entity with system account permission
    When I set the statusCode to "ACCEPTED"
    Then the statusCode property should return "ACCEPTED"

  Scenario: Changing statusCode without permission
    Given a MemberAccount entity without permission to manage members or system account
    When I try to set the statusCode to "ACCEPTED"
    Then a PermissionError should be thrown

  Scenario: Changing statusCode to an invalid value with permission to manage members
    Given a MemberAccount entity with permission to manage members
    When I try to set the statusCode to an invalid value (e.g., null or empty string)
    Then an error should be thrown indicating the value is invalid

  Scenario: Changing createdBy with permission to manage members
    Given a MemberAccount entity with permission to manage members
    When I set the createdBy to a new EndUserEntityReference
    Then the createdBy property should return the new EndUserEntityReference

  Scenario: Changing createdBy with system account permission
    Given a MemberAccount entity with system account permission
    When I set the createdBy to a new EndUserEntityReference
    Then the createdBy property should return the new EndUserEntityReference

  Scenario: Changing createdBy with permission to edit own member account
    Given a MemberAccount entity with permission to edit own member accounts and is editing own member account
    When I set the createdBy to a new EndUserEntityReference
    Then the createdBy property should return the new EndUserEntityReference

  Scenario: Changing createdBy without permission
    Given a MemberAccount entity without permission to manage members, system account, or edit own member accounts
    When I try to set the createdBy to a new EndUserEntityReference
    Then a PermissionError should be thrown