Feature: <Persistence> EndUserPersistence

  Background:
    Given a valid models context with EndUser model
    And a valid passport for domain operations

  Scenario: Creating EndUser Persistence
    When I call EndUserPersistence with models and passport
    Then I should receive an object with EndUserUnitOfWork property
    And the EndUserUnitOfWork should be properly initialized