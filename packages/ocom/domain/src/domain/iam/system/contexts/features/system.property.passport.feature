Feature: <Passport> SystemPropertyPassport

  Background:
    Given I have property domain permissions with canManageProperties true

  Scenario: Creating SystemPropertyPassport and getting visa for property
    Given I create a SystemPropertyPassport with permissions
    And I have a property entity reference
    When I call forProperty with the property reference
    Then it should return a PropertyVisa
    And the visa should allow determining permissions

  Scenario: Creating SystemPropertyPassport with no permissions
    Given I create a SystemPropertyPassport with no permissions
    And I have a property entity reference
    When I call forProperty with the property reference
    Then it should return a PropertyVisa that works with empty permissions

  Scenario: Using visa to determine permissions
    Given I create a SystemPropertyPassport with canManageProperties permission
    And I have a property entity reference
    When I get a visa for the property
    And I use determineIf to check if canManageProperties is true
    Then it should return true