Feature: <AggregateRoot> Member

  Background:
    Given a valid Passport with community permissions
    And a valid CommunityEntityReference
    And base member properties with memberName "Alice", cybersourceCustomerId "cs_123", a valid community, at least one account, a valid role, a valid profile, and valid timestamps

  Scenario: Creating a new member instance with permission to manage members
    Given a passport with permission to manage members
    When I create a new Member aggregate using getNewInstance with memberName "Alice", cybersourceCustomerId "cs_123", and a CommunityEntityReference
    Then the member's memberName should be "Alice"
    And the member's community should reference the provided CommunityEntityReference

  Scenario: Creating a new member instance with system account permission
    Given a passport with system account permission
    When I create a new Member aggregate using getNewInstance with memberName "Alice", cybersourceCustomerId "cs_123", and a CommunityEntityReference
    Then the member's memberName should be "Alice"
    And the member's community should reference the provided CommunityEntityReference

  Scenario: Creating a new member instance without permission
    Given a passport without permission to manage members or system account
    When I try to create a new Member aggregate using getNewInstance with memberName "Alice", cybersourceCustomerId "cs_123", and a CommunityEntityReference
    Then a PermissionError should be thrown

  Scenario: Changing the memberName with permission to manage members
    Given a Member aggregate with permission to manage members
    When I set the memberName to "Bob"
    Then the member's memberName should be "Bob"

  Scenario: Changing the memberName with system account permission
    Given a Member aggregate with system account permission
    When I set the memberName to "Bob"
    Then the member's memberName should be "Bob"

  Scenario: Changing the memberName without permission
    Given a Member aggregate without permission to manage members or system account
    When I try to set the memberName to "Bob"
    Then a PermissionError should be thrown

  Scenario: Changing the memberName to an invalid value
    Given a Member aggregate with permission to manage members
    When I try to set the memberName to an invalid value (e.g., null or empty string)
    Then an error should be thrown indicating the value is invalid

  Scenario: Changing the cybersourceCustomerId with permission to manage members
    Given a Member aggregate with permission to manage members
    When I set the cybersourceCustomerId to "cs_456"
    Then the member's cybersourceCustomerId should be "cs_456"

  Scenario: Changing the cybersourceCustomerId with system account permission
    Given a Member aggregate with system account permission
    When I set the cybersourceCustomerId to "cs_456"
    Then the member's cybersourceCustomerId should be "cs_456"

  Scenario: Changing the cybersourceCustomerId without permission
    Given a Member aggregate without permission to manage members or system account
    When I try to set the cybersourceCustomerId to "cs_456"
    Then a PermissionError should be thrown

  Scenario: Changing the cybersourceCustomerId to an invalid value
    Given a Member aggregate with permission to manage members
    When I try to set the cybersourceCustomerId to an invalid value (e.g., null or empty string)
    Then an error should be thrown indicating the value is invalid

  Scenario: Changing the community with permission to manage members
    Given a Member aggregate with permission to manage members
    When I set the community to a new CommunityEntityReference
    Then the member's community should reference the new CommunityEntityReference

  Scenario: Changing the community with system account permission
    Given a Member aggregate with system account permission
    When I set the community to a new CommunityEntityReference
    Then the member's community should reference the new CommunityEntityReference

  Scenario: Changing the community without permission
    Given a Member aggregate without permission to manage members or system account
    When I try to set the community to a new CommunityEntityReference
    Then a PermissionError should be thrown

  Scenario: Changing the role with permission to manage members
    Given a Member aggregate with permission to manage members
    When I set the role to a new EndUserRoleEntityReference
    Then the member's role should reference the new EndUserRoleEntityReference

  Scenario: Changing the role with system account permission
    Given a Member aggregate with system account permission
    When I set the role to a new EndUserRoleEntityReference
    Then the member's role should reference the new EndUserRoleEntityReference

  Scenario: Changing the role without permission
    Given a Member aggregate without permission to manage members or system account
    When I try to set the role to a new EndUserRoleEntityReference
    Then a PermissionError should be thrown

  Scenario: Requesting a new account with permission to manage members
    Given a Member aggregate with permission to manage members
    When I call requestNewAccount
    Then a new MemberAccount should be returned

  Scenario: Requesting a new account with system account permission
    Given a Member aggregate with system account permission
    When I call requestNewAccount
    Then a new MemberAccount should be returned

  Scenario: Requesting a new account without permission
    Given a Member aggregate without permission to manage members or system account
    When I try to call requestNewAccount
    Then a PermissionError should be thrown

  Scenario: Requesting to remove an account with permission to manage members
    Given a Member aggregate with permission to manage members and at least one account
    When I call requestRemoveAccount with a valid MemberAccountEntityReference
    Then the account should be removed from the member's accounts

  Scenario: Requesting to remove an account with system account permission
    Given a Member aggregate with system account permission and at least one account
    When I call requestRemoveAccount with a valid MemberAccountEntityReference
    Then the account should be removed from the member's accounts

  Scenario: Requesting to remove an account without permission
    Given a Member aggregate without permission to manage members or system account and at least one account
    When I try to call requestRemoveAccount with a valid MemberAccountEntityReference
    Then a PermissionError should be thrown

  Scenario: Requesting a new custom view with permission to manage members
    Given a Member aggregate with permission to manage members
    When I call requestNewCustomView
    Then a new MemberCustomView should be returned

  Scenario: Requesting a new custom view with system account permission
    Given a Member aggregate with system account permission
    When I call requestNewCustomView
    Then a new MemberCustomView should be returned

  Scenario: Requesting a new custom view without permission
    Given a Member aggregate without permission to manage members or system account
    When I try to call requestNewCustomView
    Then a PermissionError should be thrown

  Scenario: Requesting to remove a custom view with permission to manage members
    Given a Member aggregate with permission to manage members and at least one custom view
    When I call requestRemoveCustomView with a valid MemberCustomView
    Then the custom view should be removed from the member's customViews

  Scenario: Requesting to remove a custom view with system account permission
    Given a Member aggregate with system account permission and at least one custom view
    When I call requestRemoveCustomView with a valid MemberCustomView
    Then the custom view should be removed from the member's customViews

  Scenario: Requesting to remove a custom view without permission
    Given a Member aggregate without permission to manage members or system account and at least one custom view
    When I try to call requestRemoveCustomView with a valid MemberCustomView
    Then a PermissionError should be thrown

  Scenario: Getting profile, accounts, customViews, createdAt, updatedAt, and schemaVersion
    Given a Member aggregate
    Then the profile property should return a MemberProfile entity
    And the accounts property should return an array of MemberAccount entities
    And the customViews property should return an array of MemberCustomView entities
    And the createdAt property should return the correct date
    And the updatedAt property should return the correct date
    And the schemaVersion property should return the correct version
