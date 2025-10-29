Feature: <Repository> ServiceTicketV1Repository

  Background:
    Given a ServiceTicketV1Repository instance with a working Mongoose model, type converter, and passport
    And a valid Mongoose ServiceTicket document with id "507f1f77bcf86cd799439011", title "Test Ticket", description "Test Description"

  Scenario: Getting a service ticket by id
    When I call getById with "507f1f77bcf86cd799439011"
    Then I should receive a ServiceTicketV1 domain object
    And the domain object's title should be "Test Ticket"
    And the domain object's description should be "Test Description"

  Scenario: Getting a service ticket by id that does not exist
    When I call getById with "nonexistent-id"
    Then an error should be thrown indicating "ServiceTicket with id nonexistent-id not found"

  Scenario: Creating a new service ticket instance
    Given a valid Community domain object as the community
    And a valid Member domain object as the requestor
    When I call getNewInstance with title "New Ticket", description "New Description", community, and requestor
    Then I should receive a new ServiceTicketV1 domain object
    And the domain object's title should be "New Ticket"
    And the domain object's description should be "New Description"
    And the domain object's communityId should be the given community id
    And the domain object's requestorId should be the given requestor id