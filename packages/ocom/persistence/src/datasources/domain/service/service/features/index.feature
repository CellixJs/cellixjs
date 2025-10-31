Feature: Service Persistence Index

  Background:
    Given a valid models context with Service model
    And a valid passport for domain operations

  Scenario: Creating service persistence
    When I call ServicePersistence with models and passport
    Then I should receive an object with ServiceUnitOfWork property
    And the ServiceUnitOfWork should be properly initialized