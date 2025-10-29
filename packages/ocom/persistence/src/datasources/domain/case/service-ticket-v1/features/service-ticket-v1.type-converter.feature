Feature: <TypeConverter> ServiceTicketV1Converter

  Background:
    Given a valid Mongoose ServiceTicket document with title "Test Ticket", description "Test Description", status "open", priority 1, populated community and requestor fields

  Scenario: Converting a Mongoose ServiceTicket document to a domain object
    Given a ServiceTicketV1Converter instance
    When I call toDomain with the Mongoose ServiceTicket document
    Then I should receive a ServiceTicketV1 domain object
    And the domain object's title should be "Test Ticket"
    And the domain object's description should be "Test Description"
    And the domain object's status should be "open"
    And the domain object's priority should be 1

  Scenario: Converting a domain object to a Mongoose ServiceTicket document
    Given a ServiceTicketV1Converter instance
    And a ServiceTicketV1 domain object with title "New Ticket", description "New Description", status "closed", priority 2, and valid community and requestor
    When I call toPersistence with the ServiceTicketV1 domain object
    Then I should receive a Mongoose ServiceTicket document
    And the document's title should be "New Ticket"
    And the document's description should be "New Description"
    And the document's status should be "closed"
    And the document's priority should be 2
    And the document's community should be set to the correct community document
    And the document's requestor should be set to the correct requestor document