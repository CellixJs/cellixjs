Feature: <Persistence> PropertyPersistence

  Background:
    Given a valid models context with Property model
    And a valid passport for domain operations

  Scenario: Creating Property Persistence
    When I call PropertyPersistence with models and passport
    Then I should receive an object with PropertyUnitOfWork property
    And the PropertyUnitOfWork should be properly initialized