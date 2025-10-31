Feature: <Persistence> ServiceTicketV1Persistence

  Background:
    Given a valid models context with ServiceTicket model
    And a valid passport for domain operations

  Scenario: Creating ServiceTicketV1 Persistence
    When I call ServiceTicketV1Persistence with models and passport
    Then I should receive an object with ServiceTicketV1UnitOfWork property
    And the ServiceTicketV1UnitOfWork should be properly initialized