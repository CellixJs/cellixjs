Feature: GraphQL Handler Creator

  As a developer
  I want to create an Azure Functions HTTP handler for GraphQL using Apollo Server and my application services
  So that requests are routed through the correct schema, context, and middleware

  Scenario: Creating a handler with a valid ApplicationServicesFactory
    Given a valid ApplicationServicesFactory
    When graphHandlerCreator is called with the factory
    Then it should create an ApolloServer with the combined schema and middleware
    And it should return an Azure Functions HttpHandler

  Scenario: Handler context creation with headers
    Given a handler created by graphHandlerCreator
    And an incoming request with Authorization, x-member-id, and x-community-id headers
    When the handler is invoked
    Then it should call applicationServicesFactory.forRequest with the Authorization header and hints
    And it should inject the resulting applicationServices into the GraphQL context

  Scenario: Handler delegates to startServerAndCreateHandler
    Given a handler created by graphHandlerCreator
    When the handler is invoked
    Then it should delegate the request to startServerAndCreateHandler with the ApolloServer and context options
    And it should return the result from startServerAndCreateHandler
