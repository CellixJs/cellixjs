Feature: <Visa> StaffUserCommunityVisa

  Background:
    Given a valid CommunityEntityReference with id "community-1"
    And a valid StaffUserEntityReference with id "staff-1" and a role with communityPermissions

  Scenario: Creating a StaffUserCommunityVisa with a staff user and community
    When I create a StaffUserCommunityVisa with the community and staff user
    Then the visa should be created successfully

  Scenario: determineIf returns true when the permission function returns true
    Given a StaffUserCommunityVisa for the community and staff user
    When I call determineIf with a function that returns true if canManageCommunitySettings is true
    Then the result should be true

  Scenario: determineIf returns false when the permission function returns false
    Given a StaffUserCommunityVisa for the community and staff user
    When I call determineIf with a function that always returns false
    Then the result should be false

  Scenario: determineIf returns false if the staff user has no role
    Given a StaffUserEntityReference with no role
    And a CommunityEntityReference with id "community-1"
    When I create a StaffUserCommunityVisa with the community and staff user
    And I call determineIf with any function
    Then the result should be false

  Scenario: determineIf returns true if the staff user's role has the required community permission
    Given a StaffUserEntityReference with communityPermissions where canManageCommunitySettings is true
    And a CommunityEntityReference with id "community-1"
    When I create a StaffUserCommunityVisa with the community and staff user
    And I call determineIf with a function that returns canManageCommunitySettings
    Then the result should be true

  Scenario: determineIf returns false if the staff user's role does not have the required community permissionchecks all permission flags
    Given a StaffUserEntityReference with communityPermissions where canManageAllCommunities is false
    And a CommunityEntityReference with id "community-1"
    When I create a StaffUserCommunityVisa with the community and staff user
    And I call determineIf with a function that checks all permission flags
    Then all permission flags should be false

  Scenario: determineIf sets isEditingOwnMemberAccount to false
    Given a StaffUserCommunityVisa for the community and staff user
    When I call determineIf with a function that returns isEditingOwnMemberAccount
    Then the result should be false

  Scenario: determineIf sets isSystemAccount to false
    Given a StaffUserCommunityVisa for the community and staff user
    When I call determineIf with a function that returns isSystemAccount
    Then the result should be false
