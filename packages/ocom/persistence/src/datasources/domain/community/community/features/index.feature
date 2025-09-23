Feature: <Persistence> CommunityPersistence

  Background:
    Given a valid models context with Community model
    And a valid passport for domain operations

  Scenario: Creating Community Persistence
    When I call CommunityPersistence with models and passport
    Then I should receive an object with CommunityUnitOfWork property
    And the CommunityUnitOfWork should be properly initialized