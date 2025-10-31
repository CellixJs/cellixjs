Feature: Service Unit of Work

  Background:
    Given a Mongoose context factory with a working service
    And a valid Service model from the models context
    And a valid passport for domain operations

  Scenario: Creating a service unit of work
    When I call getServiceUnitOfWork with the Service model and passport
    Then I should receive a properly initialized ServiceUnitOfWork
    And the Unit of Work should have the correct repository type
    And the Unit of Work should have the correct converter type
    And the Unit of Work should have the correct event buses