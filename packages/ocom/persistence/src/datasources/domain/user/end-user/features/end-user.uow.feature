Feature: <UnitOfWork> EndUserUnitOfWork

  Background:
    Given a Mongoose context factory with a working service
    And a valid EndUser model from the models context
    And a valid passport for domain operations

  Scenario: Creating an EndUser Unit of Work
    When I call getEndUserUnitOfWork with the EndUser model and passport
    Then I should receive a properly initialized EndUserUnitOfWork
    And the Unit of Work should have the correct repository type
    And the Unit of Work should have the correct converter type
    And the Unit of Work should have the correct event buses