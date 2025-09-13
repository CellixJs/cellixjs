Feature: <Visa> MemberCommunityVisa

  Background:
    Given a valid CommunityEntityReference with id "community-1"
    And a valid MemberEntityReference with id "member-1", community id "community-1", and role with community permissions

  Scenario: Creating a MemberCommunityVisa with a member belonging to the community
    When I create a MemberCommunityVisa with the community and member
    Then the visa should be created successfully

  Scenario: determineIf returns true when the permission function returns true
    Given a MemberCommunityVisa for the member and community
    When I call determineIf with a function that returns true if canCreateCommunities is true
    Then the result should be true

  Scenario: determineIf returns false when the permission function returns false
    Given a MemberCommunityVisa for the member and community
    When I call determineIf with a function that returns false
    Then the result should be false

  Scenario: determineIf returns false if the member does not belong to the community
    Given a MemberEntityReference with community id "community-2"
    And a CommunityEntityReference with id "community-1"
    When I create a MemberCommunityVisa with the community and member
    And I call determineIf with any function
    Then the result should be false

  Scenario: determineIf returns true if the member's role has the required permission
    Given a MemberEntityReference with communityPermissions where canManageCommunitySettings is true
    And a CommunityEntityReference with id "community-1"
    When I create a MemberCommunityVisa with the community and member
    And I call determineIf with a function that returns canManageCommunitySettings
    Then the result should be true

  Scenario: determineIf returns false if the member's role does not have the required permission
    Given a MemberEntityReference with communityPermissions where canManageCommunitySettings is false
    And a CommunityEntityReference with id "community-1"
    When I create a MemberCommunityVisa with the community and member
    And I call determineIf with a function that returns canManageCommunitySettings
    Then the result should be false

  Scenario: determineIf sets isEditingOwnMemberAccount to false
    Given a MemberCommunityVisa for the member and community
    When I call determineIf with a function that returns isEditingOwnMemberAccount
    Then the result should be false

  Scenario: determineIf sets canCreateCommunities to true
    Given a MemberCommunityVisa for the member and community
    When I call determineIf with a function that returns canCreateCommunities
    Then the result should be true

  Scenario: determineIf sets canManageVendorUserRolesAndPermissions to false
    Given a MemberCommunityVisa for the member and community
    When I call determineIf with a function that returns canManageVendorUserRolesAndPermissions
    Then the result should be false

  Scenario: determineIf sets isSystemAccount to false
    Given a MemberCommunityVisa for the member and community
    When I call determineIf with a function that returns isSystemAccount
    Then the result should be false
