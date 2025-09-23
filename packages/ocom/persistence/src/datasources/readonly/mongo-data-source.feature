Feature: MongoDataSource

  Scenario: Creating Mongo Data Source Implementation
    When I create a MongoDataSourceImpl with a Mongoose model
    Then I should receive a MongoDataSource instance
    And the instance should have all required methods

  Scenario: Finding documents with filter
    Given a Mongoose model with find method
    When I call find with a filter object
    Then I should receive an array of documents with id field appended

  Scenario: Finding documents with options
    Given a Mongoose model with find method
    When I call find with filter and options including limit, skip, and sort
    Then I should receive filtered and sorted documents

  Scenario: Finding documents with projection
    Given a Mongoose model with find method
    When I call find with filter and projection options
    Then I should receive documents with specified fields only

  Scenario: Finding one document
    Given a Mongoose model with findOne method
    When I call findOne with a filter
    Then I should receive a single document or null

  Scenario: Finding one document with population
    Given a Mongoose model with findOne method
    When I call findOne with filter and populateFields option
    Then I should receive a document with populated fields

  Scenario: Finding document by valid ID
    Given a Mongoose model with findById method
    When I call findById with a valid ObjectId string
    Then I should receive the document with id field appended

  Scenario: Finding document by invalid ID
    Given a Mongoose model with findById method
    When I call findById with an invalid ObjectId string
    Then I should receive null

  Scenario: Finding document by ID with population
    Given a Mongoose model with findById method
    When I call findById with valid ID and populateFields option
    Then I should receive the document with populated fields

  Scenario: Aggregating documents
    Given a Mongoose model with aggregate method
    When I call aggregate with a pipeline
    Then I should receive aggregated results with id field appended