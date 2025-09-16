Feature: <Class> SystemCommunityPassport

  Background:
    Given I have community domain permissions with canManageMembers true

  Scenario: Creating SystemCommunityPassport and getting visa for community
    Given I create a SystemCommunityPassport with permissions
    And I have a community entity reference
    When I call forCommunity with the community reference
    Then it should return a CommunityVisa
    And the visa should allow determining permissions

  Scenario: Creating SystemCommunityPassport with no permissions
    Given I create a SystemCommunityPassport with no permissions
    And I have a community entity reference
    When I call forCommunity with the community reference
    Then it should return a CommunityVisa that works with empty permissions

  Scenario: Using visa to determine permissions
    Given I create a SystemCommunityPassport with canManageMembers permission
    And I have a community entity reference
    When I get a visa for the community
    And I use determineIf to check if canManageMembers is true
    Then it should return true