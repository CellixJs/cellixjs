Feature: MongoRepositoryBase

  Background:
    Given an initialized repository

  Scenario: Initializing the repository
    Given valid dependencies for a model and type converter
    When the constructor for MongoRepositoryBase is called
    Then it should construct with dependencies

  Scenario: Creating a repository instance with static create
    Given valid dependencies for a model and type converter
    When the static create method is called
    Then it should create an instance of the repository

  Scenario: Saving a non-deleted aggregate
    When the repository is saved with a non-deleted aggregate
    Then it should dispatch all domain events before clearing them
    And it should call the model save method for the aggregate and return the domain object

  Scenario: Saving a deleted aggregate
    When the repository is saved with a deleted aggregate
    Then it should call the model delete method for the aggregate and return the aggregate

  Scenario: Save operation fails
    When the repository save operation fails
    Then it should throw if mongoObj.save throws

  Scenario: Save operation correctly dispatches domain events
    Given a repository with an aggregate that has domain events
    When the repository saves the aggregate
    Then it should dispatch all domain events using the event dispatcher

  Scenario: Save operation correctly fails when domain event handler fails
    Given a repository with an aggregate that has a domain event
    And a domain event handler that throws an error
    When the repository saves the aggregate
    Then it should propagate the error from the domain event handler

  Scenario: Getting an aggregate that exists
    When the repository gets an aggregate that exists
    Then it should return the domain object if found

  Scenario: Getting an aggregate that does not exist
    When the repository gets an aggregate that does not exist
    Then it should throw NotFoundError if the document is not found

  Scenario: Domain conversion fails on get
    When the repository gets an aggregate root and the domain conversion fails
    Then it should propagate errors thrown by typeConverter.toDomain

  Scenario: Persistence layer fails on get
    When the repository gets an aggregate root that does exist and the persistence layer fails
    Then it should propagate errors thrown by model.findById().exec()

  Scenario: Getting integration events with events present
    Given an initialized repository with aggregates in itemsInTransaction
    When getIntegrationEvents is called and aggregates have integration events
    Then it should return all integration events and clear them from each aggregate

  Scenario: Getting integration events with no events present
    Given an initialized repository with aggregates in itemsInTransaction
    When getIntegrationEvents is called and aggregates have no integration events
    Then it should return an empty array and clear integration events from each aggregate