Feature: MongooseDomainAdapter

  Scenario: Constructing a MongooseDomainAdapter
    Given a Mongoose document with id, createdAt, updatedAt, and schemaVersion
    When a domain adapter is constructed with the document
    Then the doc property should reference the document

  Scenario: Accessing id returns string version of document id
    Given a domain adapter constructed with a document with an ObjectId
    When I access the id property
    Then it should return the string version of the document id

  Scenario: Accessing createdAt, updatedAt, and schemaVersion
    Given a domain adapter constructed with a document with createdAt, updatedAt, and schemaVersion
    When I access the createdAt, updatedAt, and schemaVersion properties
    Then they should return the corresponding values from the document
