Feature: <Passport> SystemServicePassport

  Background:
    Given I have service domain permissions with canManageServices true

  Scenario: Creating SystemServicePassport and getting visa for service
    Given I create a SystemServicePassport with permissions
    And I have a service entity reference
    When I call forService with the service reference
    Then it should return a ServiceVisa
    And the visa should allow determining permissions

  Scenario: Creating SystemServicePassport with no permissions
    Given I create a SystemServicePassport with no permissions
    And I have a service entity reference
    When I call forService with the service reference
    Then it should return a ServiceVisa that works with empty permissions

  Scenario: Using visa to determine permissions
    Given I create a SystemServicePassport with canManageServices permission
    And I have a service entity reference
    When I get a visa for the service
    And I use determineIf to check if canManageServices is true
    Then it should return true