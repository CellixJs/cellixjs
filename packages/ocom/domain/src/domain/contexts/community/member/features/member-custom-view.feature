Feature: <Entity> MemberCustomView

  Background:
    Given valid MemberCustomViewProps with name "Default View", type "list", filters ["active"], sortOrder "asc", columnsToDisplay ["name", "email"]
    And a valid CommunityVisa

  Scenario: Getting name, type, filters, sortOrder, and columnsToDisplay
    Given a MemberCustomView entity
    Then the name property should return "Default View"
    And the type property should return "list"
    And the filters property should return ["active"]
    And the sortOrder property should return "asc"
    And the columnsToDisplay property should return ["name", "email"]

  Scenario: Changing name with permission to manage members
    Given a MemberCustomView entity with permission to manage members
    When I set the name to "My View"
    Then the name property should return "My View"

  Scenario: Changing name with permission to edit own member account and is editing own member account
    Given a MemberCustomView entity with permission to edit own member accounts and is editing own member account
    When I set the name to "My View"
    Then the name property should return "My View"

  Scenario: Changing name with system account permission
    Given a MemberCustomView entity with system account permission
    When I set the name to "My View"
    Then the name property should return "My View"

  Scenario: Changing name without permission
    Given a MemberCustomView entity without permission to manage members, system account, or edit own member accounts
    When I try to set the name to "My View"
    Then a PermissionError should be thrown

  Scenario: Changing name to an invalid value
    Given a MemberCustomView entity with permission to manage members
    When I try to set the name to an invalid value (e.g., null or empty string)
    Then an error should be thrown indicating the value is invalid

  Scenario: Changing type with permission to manage members
    Given a MemberCustomView entity with permission to manage members
    When I set the type to "PROPERTY"
    Then the type property should return "PROPERTY"

  Scenario: Changing type with permission to edit own member account and is editing own member account
    Given a MemberCustomView entity with permission to edit own member accounts and is editing own member account
    When I set the type to "PROPERTY"
    Then the type property should return "PROPERTY"

  Scenario: Changing type with system account permission
    Given a MemberCustomView entity with system account permission
    When I set the type to "PROPERTY"
    Then the type property should return "PROPERTY"

  Scenario: Changing type without permission
    Given a MemberCustomView entity without permission to manage members, system account, or edit own member accounts
    When I try to set the type to "PROPERTY"
    Then a PermissionError should be thrown

  Scenario: Changing type to an invalid value
    Given a MemberCustomView entity with permission to manage members
    When I try to set the type to an invalid value "INVALID"
    Then an error should be thrown indicating the value is invalid

  Scenario: Changing filters with permission to manage members
    Given a MemberCustomView entity with permission to manage members
    When I set the filters to ["inactive"]
    Then the filters property should return ["inactive"]

  Scenario: Changing filters with permission to edit own member account and is editing own member account
    Given a MemberCustomView entity with permission to edit own member accounts and is editing own member account
    When I set the filters to ["inactive"]
    Then the filters property should return ["inactive"]

  Scenario: Changing filters with system account permission
    Given a MemberCustomView entity with system account permission
    When I set the filters to ["inactive"]
    Then the filters property should return ["inactive"]

  Scenario: Changing filters without permission
    Given a MemberCustomView entity without permission to manage members, system account, or edit own member accounts
    When I try to set the filters to ["inactive"]
    Then a PermissionError should be thrown

  Scenario: Changing filters to an invalid value
    Given a MemberCustomView entity with permission to manage members
    When I try to set the filters to an invalid value (e.g., a string instead of an array)
    Then an error should be thrown indicating the value is invalid

  Scenario: Changing sortOrder with permission to manage members
    Given a MemberCustomView entity with permission to manage members
    When I set the sortOrder to "desc"
    Then the sortOrder property should return "desc"

  Scenario: Changing sortOrder with permission to edit own member account and is editing own member account
    Given a MemberCustomView entity with permission to edit own member accounts and is editing own member account
    When I set the sortOrder to "desc"
    Then the sortOrder property should return "desc"

  Scenario: Changing sortOrder with system account permission
    Given a MemberCustomView entity with system account permission
    When I set the sortOrder to "desc"
    Then the sortOrder property should return "desc"

  Scenario: Changing sortOrder without permission
    Given a MemberCustomView entity without permission to manage members, system account, or edit own member accounts
    When I try to set the sortOrder to "desc"
    Then a PermissionError should be thrown

  Scenario: Changing sortOrder to an invalid value
    Given a MemberCustomView entity with permission to manage members
    When I try to set the sortOrder to an invalid value (e.g., null or empty string)
    Then an error should be thrown indicating the value is invalid

  Scenario: Changing columnsToDisplay with permission to manage members
    Given a MemberCustomView entity with permission to manage members
    When I set the columnsToDisplay to ["email", "status"]
    Then the columnsToDisplay property should return ["email", "status"]

  Scenario: Changing columnsToDisplay with permission to edit own member account and is editing own member account
    Given a MemberCustomView entity with permission to edit own member accounts and is editing own member account
    When I set the columnsToDisplay to ["email", "status"]
    Then the columnsToDisplay property should return ["email", "status"]

  Scenario: Changing columnsToDisplay with system account permission
    Given a MemberCustomView entity with system account permission
    When I set the columnsToDisplay to ["email", "status"]
    Then the columnsToDisplay property should return ["email", "status"]

  Scenario: Changing columnsToDisplay without permission
    Given a MemberCustomView entity without permission to manage members, system account, or edit own member accounts
    When I try to set the columnsToDisplay to ["email", "status"]
    Then a PermissionError should be thrown

  Scenario: Changing columnsToDisplay to an invalid value
    Given a MemberCustomView entity with permission to manage members
    When I try to set the columnsToDisplay to an invalid value (e.g., a string instead of array)
    Then an error should be thrown indicating the value is invalid