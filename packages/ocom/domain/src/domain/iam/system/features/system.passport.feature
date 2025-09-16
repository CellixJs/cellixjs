Feature: <Class> SystemPassport

  Background:
    Given I have a permissions object with canManageMembers true

  Scenario: Creating SystemPassport and accessing community passport
    Given I create a SystemPassport with permissions
    When I access the community property
    Then it should return a SystemCommunityPassport instance
    And accessing community property again should return the same instance

  Scenario: Creating SystemPassport and accessing service passport
    Given I create a SystemPassport with permissions
    When I access the service property
    Then it should return a SystemServicePassport instance
    And accessing service property again should return the same instance

  Scenario: Creating SystemPassport and accessing user passport
    Given I create a SystemPassport with permissions
    When I access the user property
    Then it should return a SystemUserPassport instance
    And accessing user property again should return the same instance

  Scenario: Creating SystemPassport with no permissions
    Given I create a SystemPassport with no permissions
    When I access the community, service, and user properties
    Then all passport instances should be created successfully