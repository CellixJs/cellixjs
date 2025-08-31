Feature: Apollo Server Service
  As a developer using the CellixJS framework
  I want to have an Apollo Server infrastructure service
  So that I can initialize Apollo Server once and reuse it throughout the application lifecycle

  Scenario: Creating a new Apollo Server service instance with valid options
    Given valid Apollo Server options
    When a new service is created
    Then it should be created successfully

  Scenario: Creating a new Apollo Server service instance with missing schema
    Given Apollo Server options without schema
    When attempting to create a new service
    Then it should throw an error about missing schema

  Scenario: Starting up the Apollo Server service
    Given an Apollo Server service instance
    When the service is started up
    Then it should create and start the Apollo Server with correct options

  Scenario: Shutting down the Apollo Server service when started
    Given a started Apollo Server service instance
    When the service is shutdown
    Then it should stop the Apollo Server and log that the service stopped

  Scenario: Shutting down the Apollo Server service when not started
    Given an Apollo Server service instance that has not been started
    When the service is shutdown
    Then it should throw an error indicating shutdown cannot proceed

  Scenario: Accessing the server property when started
    Given a started Apollo Server service instance
    When the server property is accessed
    Then it should return the internal Apollo Server instance

  Scenario: Accessing the server property when not started
    Given an Apollo Server service instance that has not been started
    When the server property is accessed
    Then it should throw an error indicating the service is not started