Feature: <UnitOfWork> EndUserRoleUnitOfWork

  Background:
    Given a Mongoose context factory with a working service
    And a valid EndUserRole model from the models context
    And a valid passport for domain operations

  Scenario: Creating an EndUserRole Unit of Work
    When I call getEndUserRoleUnitOfWork with the EndUserRole model and passport
    Then I should receive a properly initialized EndUserRoleUnitOfWork
    And the Unit of Work should have the correct repository type
    And the Unit of Work should have the correct converter type
    And the Unit of Work should have the correct event buses