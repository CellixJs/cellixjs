Feature: <Visa> MemberUserEndUserVisa

  Background:
    Given a valid EndUserEntityReference with id "user-1"
    And a valid MemberEntityReference with id "member-1" and accounts including "user-1"

  Scenario: Creating a MemberUserEndUserVisa
    When I create a MemberUserEndUserVisa with the end user and member
    Then the visa should be created successfully

  Scenario: determineIf returns true when the predicate returns true
    Given a MemberUserEndUserVisa for the end user and member
    When I call determineIf with a function that always returns true
    Then the result should be true

  Scenario: determineIf returns false when the predicate returns false
    Given a MemberUserEndUserVisa for the end user and member
    When I call determineIf with a function that always returns false
    Then the result should be false

  Scenario: determineIf sets isEditingOwnAccount to true if the member has an account with the end user's id
    Given a MemberEntityReference with accounts including an account with id "user-1"
    And an EndUserEntityReference with id "user-1"
    When I create a MemberUserEndUserVisa with the end user and member
    And I call determineIf with a function that returns isEditingOwnAccount
    Then the result should be true

  Scenario: determineIf sets isEditingOwnAccount to false if the member does not have an account with the end user's id
    Given a MemberEntityReference with accounts not including an account with id "user-2"
    And an EndUserEntityReference with id "user-2"
    When I create a MemberUserEndUserVisa with the end user and member
    And I call determineIf with a function that returns isEditingOwnAccount
    Then the result should be false

  Scenario: determineIf returns false for canManageEndUsers
    Given a MemberUserEndUserVisa for the end user and member
    When I call determineIf with a function that returns canManageEndUsers
    Then the result should be false

  Scenario: determineIf returns false for canManageStaffRolesAndPermissions
    Given a MemberUserEndUserVisa for the end user and member
    When I call determineIf with a function that returns canManageStaffRolesAndPermissions
    Then the result should be false

  Scenario: determineIf returns false for canManageStaffUsers
    Given a MemberUserEndUserVisa for the end user and member
    When I call determineIf with a function that returns canManageStaffUsers
    Then the result should be false

  Scenario: determineIf returns false for canManageVendorUsers
    Given a MemberUserEndUserVisa for the end user and member
    When I call determineIf with a function that returns canManageVendorUsers
    Then the result should be false

  Scenario: determineIf returns false for isSystemAccount
    Given a MemberUserEndUserVisa for the end user and member
    When I call determineIf with a function that returns isSystemAccount
    Then the result should be false