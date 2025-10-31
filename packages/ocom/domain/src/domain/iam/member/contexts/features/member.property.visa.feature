Feature: <Visa> MemberPropertyVisa

  Background:
    Given a valid PropertyEntityReference with id "property-1", community id "community-1", owner id "member-1"
    And a valid MemberEntityReference with id "member-1", community id "community-1", and role with property permissions

  Scenario: Creating a MemberPropertyVisa with a member belonging to the community
    When I create a MemberPropertyVisa with the property and member
    Then the visa should be created successfully

  Scenario: determineIf returns true when the permission function returns true
    Given a MemberPropertyVisa for the property and member
    When I call determineIf with a function that returns true if canManageProperties is true
    Then the result should be true

  Scenario: determineIf returns false when the permission function returns false
    Given a MemberPropertyVisa for the property and member
    When I call determineIf with a function that returns false
    Then the result should be false

  Scenario: determineIf returns false if the member does not belong to the community
    Given a MemberEntityReference with community id "community-2"
    And a PropertyEntityReference with community id "community-1"
    When I create a MemberPropertyVisa with the property and member
    And I call determineIf with any function
    Then the result should be false

  Scenario: determineIf returns true if the member's role has the required permission
    Given a MemberEntityReference with propertyPermissions where canManageProperties is true
    And a PropertyEntityReference with community id "community-1"
    When I create a MemberPropertyVisa with the property and member
    And I call determineIf with a function that returns canManageProperties
    Then the result should be true

  Scenario: determineIf returns false if the member's role does not have the required permission
    Given a MemberEntityReference with propertyPermissions where canManageProperties is false
    And a PropertyEntityReference with community id "community-1"
    When I create a MemberPropertyVisa with the property and member
    And I call determineIf with a function that returns canManageProperties
    Then the result should be false

  Scenario: determineIf sets isEditingOwnProperty to true when member is the owner
    Given a MemberPropertyVisa for the property and member
    When I call determineIf with a function that returns isEditingOwnProperty
    Then the result should be true

  Scenario: determineIf sets isEditingOwnProperty to false when member is not the owner
    Given a MemberEntityReference with id "member-2"
    When I create a MemberPropertyVisa with the property and member
    And I call determineIf with a function that returns isEditingOwnProperty
    Then the result should be false

  Scenario: determineIf sets canEditOwnProperty based on role permissions
    Given a MemberEntityReference with propertyPermissions where canEditOwnProperty is true
    When I create a MemberPropertyVisa with the property and member
    And I call determineIf with a function that returns canEditOwnProperty
    Then the result should be true

  Scenario: determineIf sets isSystemAccount to false
    Given a MemberPropertyVisa for the property and member
    When I call determineIf with a function that returns isSystemAccount
    Then the result should be false