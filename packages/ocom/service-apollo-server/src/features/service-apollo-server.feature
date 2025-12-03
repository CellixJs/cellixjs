Feature: ServiceApolloServer

  Scenario: Creating a service with schema
    Given a GraphQL schema
    When a ServiceApolloServer is created with the schema
    Then it should store the options
    And it should not have started the server

  Scenario: Starting up the service successfully
    Given a ServiceApolloServer with a schema
    When startUp is called
    Then it should create an ApolloServer instance
    And it should start the server
    And it should return the ApolloServer instance
    And it should log "ServiceApolloServer started"

  Scenario: Starting up with middleware applied
    Given a ServiceApolloServer with schema and middleware
    When startUp is called
    Then it should apply the middleware to the schema
    And it should create an ApolloServer with the modified schema

  Scenario: Starting up with custom options
    Given a ServiceApolloServer with custom introspection, allowBatchedHttpRequests, and maxDepth
    When startUp is called
    Then it should configure the ApolloServer with the custom options
    And it should apply depthLimit validation rule

  Scenario: Accessing server before startup
    Given a ServiceApolloServer that has not been started
    When the server property is accessed
    Then it should throw an error indicating the service is not started

  Scenario: Shutting down the service
    Given a started ServiceApolloServer
    When shutDown is called
    Then it should stop the ApolloServer
    And it should set the server to undefined
    And it should log "ServiceApolloServer stopped"

  Scenario: Accessing server after shutdown
    Given a ServiceApolloServer that has been shut down
    When the server property is accessed
    Then it should throw an error indicating the service is not started

  Scenario: Shutting down before startup
    Given a ServiceApolloServer that has not been started
    When shutDown is called
    Then it should throw an error indicating shutdown cannot proceed