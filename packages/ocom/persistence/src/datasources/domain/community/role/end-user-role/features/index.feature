Feature: <Persistence> EndUserRolePersistence

  Background:
    Given a valid models context with EndUserRole model
    And a valid passport for domain operations

  Scenario: Creating EndUserRole Persistence
    When I call EndUserRolePersistence with models and passport
    Then I should receive an object with EndUserRoleUnitOfWork property
    And the EndUserRoleUnitOfWork should be properly initialized