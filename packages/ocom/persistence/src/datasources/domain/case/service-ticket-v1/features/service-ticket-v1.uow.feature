Feature: <UnitOfWork> ServiceTicketV1UnitOfWork

  Background:
    Given a Mongoose context factory with a working service
    And a valid ServiceTicket model from the models context
    And a valid passport for domain operations

  Scenario: Creating a ServiceTicketV1 Unit of Work
    When I call getServiceTicketV1UnitOfWork with the ServiceTicket model and passport
    Then I should receive a properly initialized ServiceTicketV1UnitOfWork
    And the Unit of Work should have the correct repository type
    And the Unit of Work should have the correct converter type
    And the Unit of Work should have the correct event buses