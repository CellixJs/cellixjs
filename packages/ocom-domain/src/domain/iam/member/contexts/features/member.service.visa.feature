Feature: <Visa> MemberServiceVisa

  Background:
    Given a valid ServiceEntityReference with id "service-1" and community id "community-1"
    And a valid MemberEntityReference with id "member-1", community id "community-1", and role with service permissions

  Scenario: Creating a MemberServiceVisa with a member belonging to the service's community
    When I create a MemberServiceVisa with the service and member
    Then the visa should be created successfully

  Scenario: determineIf returns true when the permission function returns true
    Given a MemberServiceVisa for the service and member
    When I call determineIf with a function that returns true if canManageServices is true
    Then the result should be true

  Scenario: determineIf returns false when the permission function returns false
    Given a MemberServiceVisa for the service and member
    When I call determineIf with a function that returns false
    Then the result should be false

  Scenario: determineIf returns false if the member does not belong to the service's community
    Given a MemberEntityReference with community id "community-2"
    And a ServiceEntityReference with id "service-1" and community id "community-1"
    When I create a MemberServiceVisa with the service and member
    And I call determineIf with any function
    Then the result should be false

  Scenario: determineIf returns true if the member's role has the required service permission
    Given a MemberEntityReference with servicePermissions where canManageServices is true
    And a ServiceEntityReference with id "service-1" and community id "community-1"
    When I create a MemberServiceVisa with the service and member
    And I call determineIf with a function that returns canManageServices
    Then the result should be true

  Scenario: determineIf returns false if the member's role does not have the required service permission
    Given a MemberEntityReference with servicePermissions where canManageServices is false
    And a ServiceEntityReference with id "service-1" and community id "community-1"
    When I create a MemberServiceVisa with the service and member
    And I call determineIf with a function that returns canManageServices
    Then the result should be false

  Scenario: determineIf sets isSystemAccount to false
    Given a MemberServiceVisa for the service and member
    When I call determineIf with a function that returns isSystemAccount
    Then the result should be false
