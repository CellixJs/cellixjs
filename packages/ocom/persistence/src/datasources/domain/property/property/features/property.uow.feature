Feature: <UnitOfWork> PropertyUnitOfWork

  Background:
    Given a Mongoose context factory with a working service
    And a valid Property model from the models context
    And a valid passport for domain operations

  Scenario: Creating a Property Unit of Work
    When I call getPropertyUnitOfWork with the Property model and passport
    Then I should receive a properly initialized PropertyUnitOfWork
    And the Unit of Work should have the correct repository type
    And the Unit of Work should have the correct converter type
    And the Unit of Work should have the correct event buses