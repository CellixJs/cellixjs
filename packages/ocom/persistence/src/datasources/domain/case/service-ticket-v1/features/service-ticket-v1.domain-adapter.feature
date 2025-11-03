Feature: <DomainAdapter> ServiceTicketV1DomainAdapter

  Background:
    Given a valid Mongoose ServiceTicket document with title "Test Ticket", description "Test Description", status "open", priority 1

  Scenario: Getting and setting the title property
    Given a ServiceTicketV1DomainAdapter for the document
    When I get the title property
    Then it should return "Test Ticket"
    When I set the title property to "New Title"
    Then the document's title should be "New Title"

  Scenario: Getting and setting the description property
    Given a ServiceTicketV1DomainAdapter for the document
    When I get the description property
    Then it should return "Test Description"
    When I set the description property to "New Description"
    Then the document's description should be "New Description"

  Scenario: Getting and setting the status property
    Given a ServiceTicketV1DomainAdapter for the document
    When I get the status property
    Then it should return "open"
    When I set the status property to "closed"
    Then the document's status should be "closed"

  Scenario: Getting and setting the priority property
    Given a ServiceTicketV1DomainAdapter for the document
    When I get the priority property
    Then it should return 1
    When I set the priority property to 2
    Then the document's priority should be 2

  Scenario: Getting the ticketType property
    Given a ServiceTicketV1DomainAdapter for the document
    When I get the ticketType property
    Then it should return "maintenance"

  Scenario: Getting the communityId property when populated
    Given a ServiceTicketV1DomainAdapter for the document with populated community
    When I get the communityId property
    Then it should return the community's id as a string

  Scenario: Getting the communityId property when not populated
    Given a ServiceTicketV1DomainAdapter for a document with community as an ObjectId
    When I get the communityId property
    Then an error should be thrown indicating "community is not populated"

  Scenario: Setting the communityId property
    Given a ServiceTicketV1DomainAdapter for the document
    When I set the communityId property to "507f1f77bcf86cd799439012"
    Then the document's community should be set to the ObjectId "507f1f77bcf86cd799439012"

  Scenario: Getting the requestorId property when populated
    Given a ServiceTicketV1DomainAdapter for the document with populated requestor
    When I get the requestorId property
    Then it should return the requestor's id as a string

  Scenario: Getting the requestorId property when not populated
    Given a ServiceTicketV1DomainAdapter for a document with requestor as an ObjectId
    When I get the requestorId property
    Then an error should be thrown indicating "requestor is not populated"

  Scenario: Setting the requestorId property
    Given a ServiceTicketV1DomainAdapter for the document
    When I set the requestorId property to "507f1f77bcf86cd799439013"
    Then the document's requestor should be set to the ObjectId "507f1f77bcf86cd799439013"

  Scenario: Getting and setting the propertyId property
    Given a ServiceTicketV1DomainAdapter for the document
    When I get the propertyId property
    Then it should return undefined
    When I set the propertyId property to "507f1f77bcf86cd799439014"
    Then the document's property should be set to the ObjectId "507f1f77bcf86cd799439014"

  Scenario: Getting and setting the assignedToId property
    Given a ServiceTicketV1DomainAdapter for the document
    When I get the assignedToId property
    Then it should return undefined
    When I set the assignedToId property to "507f1f77bcf86cd799439015"
    Then the document's assignedTo should be set to the ObjectId "507f1f77bcf86cd799439015"

  Scenario: Getting and setting the serviceId property
    Given a ServiceTicketV1DomainAdapter for the document
    When I get the serviceId property
    Then it should return undefined
    When I set the serviceId property to "507f1f77bcf86cd799439016"
    Then the document's service should be set to the ObjectId "507f1f77bcf86cd799439016"

  Scenario: Getting the activityLog property
    Given a ServiceTicketV1DomainAdapter for the document
    When I get the activityLog property
    Then it should return a MongoosePropArray of ServiceTicketV1ActivityDetail

  Scenario: Getting the messages property
    Given a ServiceTicketV1DomainAdapter for the document
    When I get the messages property
    Then it should return a MongoosePropArray of ServiceTicketV1Message

  Scenario: Getting readonly properties
    Given a ServiceTicketV1DomainAdapter for the document
    When I get the createdAt property
    Then it should return a Date for createdAt
    When I get the updatedAt property
    Then it should return a Date for updatedAt
    When I get the schemaVersion property
    Then it should return "1.0.0" for schemaVersion

  Scenario: Getting and setting the hash property
    Given a ServiceTicketV1DomainAdapter for the document
    When I get the hash property
    Then it should return ""
    When I set the hash property to "new-hash"
    Then the document's hash should be "new-hash"

  Scenario: Getting and setting the lastIndexed property
    Given a ServiceTicketV1DomainAdapter for the document
    When I get the lastIndexed property
    Then it should return undefined
    When I set the lastIndexed property to a Date
    Then the document's lastIndexed should be set to that Date

  Scenario: Getting and setting the updateIndexFailedDate property
    Given a ServiceTicketV1DomainAdapter for the document
    When I get the updateIndexFailedDate property
    Then it should return undefined
    When I set the updateIndexFailedDate property to a Date
    Then the document's updateIndexFailedDate should be set to that Date

  Scenario: Getting activity detail properties
    Given a ServiceTicketV1ActivityDetailDomainAdapter for a document
    When I get the activity detail properties
    Then it should have activityType "created"
    And activityDescription "Ticket created"
    And activityBy should be a member reference

  Scenario: Setting activity detail properties
    Given a ServiceTicketV1ActivityDetailDomainAdapter for a document
    When I set the activityType to "updated"
    Then the document's activityType should be "updated"

  Scenario: Getting message properties
    Given a ServiceTicketV1MessageDomainAdapter for a document
    When I get the message properties
    Then it should have sentBy "test@example.com"
    And message "Test message"
    And initiatedBy should be a member reference

  Scenario: Setting message properties
    Given a ServiceTicketV1MessageDomainAdapter for a document
    When I set the message to "Updated message"
    Then the document's message should be "Updated message"

  Scenario: Loading activityBy when already populated
    Given a ServiceTicketV1ActivityDetailDomainAdapter for a document with populated activityBy
    When I load the activityBy
    Then it should return a Member entity reference

  Scenario: Loading activityBy when not populated
    Given a ServiceTicketV1ActivityDetailDomainAdapter for a document with activityBy as an ObjectId
    When I load the activityBy
    Then it should populate and return a Member entity reference

  Scenario: Loading initiatedBy when already populated
    Given a ServiceTicketV1MessageDomainAdapter for a document with populated initiatedBy
    When I load the initiatedBy
    Then it should return a Member entity reference

  Scenario: Loading initiatedBy when not populated
    Given a ServiceTicketV1MessageDomainAdapter for a document with initiatedBy as an ObjectId
    When I load the initiatedBy
    Then it should populate and return a Member entity reference

  Scenario: Getting the community property when populated
    Given a ServiceTicketV1DomainAdapter for the document with populated community
    When I get the community property
    Then it should return a Community domain adapter

  Scenario: Getting the community property when not set
    Given a ServiceTicketV1DomainAdapter for the document without community
    When I get the community property
    Then an error should be thrown indicating "community is not populated"

  Scenario: Getting the requestor property when populated
    Given a ServiceTicketV1DomainAdapter for the document with populated requestor
    When I get the requestor property
    Then it should return a Member domain adapter

  Scenario: Getting the requestor property when not set
    Given a ServiceTicketV1DomainAdapter for the document without requestor
    When I get the requestor property
    Then an error should be thrown indicating "requestor is not populated"

  Scenario: Loading the community when already populated
    Given a ServiceTicketV1DomainAdapter for the document with populated community
    When I load the community
    Then it should return a Community domain adapter

  Scenario: Loading the community when not populated
    Given a ServiceTicketV1DomainAdapter for the document with community as an ObjectId
    When I load the community
    Then it should populate and return a Community domain adapter

  Scenario: Loading the requestor when already populated
    Given a ServiceTicketV1DomainAdapter for the document with populated requestor
    When I load the requestor
    Then it should return a Member domain adapter

  Scenario: Loading the requestor when not populated
    Given a ServiceTicketV1DomainAdapter for the document with requestor as an ObjectId
    When I load the requestor
    Then it should populate and return a Member domain adapter

  Scenario: Setting the community property
    Given a ServiceTicketV1DomainAdapter for the document
    When I set the community property to a Community entity reference
    Then the document's community should be set to that reference

  Scenario: Setting the community property with a domain object
    Given a ServiceTicketV1DomainAdapter for the document
    When I set the community property to a Community domain object
    Then the document's community should be set to the domain object's document

  Scenario: Setting the community property with missing id
    Given a ServiceTicketV1DomainAdapter for the document
    When I set the community property to a reference without id
    Then an error should be thrown indicating "community reference is missing id"

  Scenario: Setting the requestor property
    Given a ServiceTicketV1DomainAdapter for the document
    When I set the requestor property to a Member entity reference
    Then the document's requestor should be set to that reference

  Scenario: Setting the requestor property with a domain object
    Given a ServiceTicketV1DomainAdapter for the document
    When I set the requestor property to a Member domain object
    Then the document's requestor should be set to the domain object's document

  Scenario: Setting the requestor property with missing id
    Given a ServiceTicketV1DomainAdapter for the document
    When I set the requestor property to a reference without id
    Then an error should be thrown indicating "member reference is missing id"

  Scenario: Setting the community property with null reference
    Given a ServiceTicketV1DomainAdapter for the document
    When I set the community property to null
    Then an error should be thrown indicating "community reference is missing id"

  Scenario: Setting the requestor property with null reference
    Given a ServiceTicketV1DomainAdapter for the document
    When I set the requestor property to null
    Then an error should be thrown indicating "member reference is missing id"

  Scenario: Setting the community property with undefined reference
    Given a ServiceTicketV1DomainAdapter for the document
    When I set the community property to undefined
    Then an error should be thrown indicating "community reference is missing id"

  Scenario: Setting the requestor property with undefined reference
    Given a ServiceTicketV1DomainAdapter for the document
    When I set the requestor property to undefined
    Then an error should be thrown indicating "member reference is missing id"