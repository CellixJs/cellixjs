Feature: Azure Functions GraphQL Handler

  As a developer
  I want to expose a GraphQL API via Azure Functions using Apollo Server
  So that HTTP requests are correctly handled and GraphQL responses are returned

  Scenario: Handling a valid GraphQL POST request
    Given an initialized ApolloServer instance
    And a valid POST HttpRequest with a JSON body containing a GraphQL query
    When the Azure Functions handler is invoked
    Then it should call ApolloServer.executeHTTPGraphQLRequest with the normalized request
    And it should return a 200 response with the GraphQL result

  Scenario: Handling a valid GraphQL GET request
    Given an initialized ApolloServer instance
    And a valid GET HttpRequest with a query string containing a GraphQL query
    When the Azure Functions handler is invoked
    Then it should call ApolloServer.executeHTTPGraphQLRequest with the normalized request
    And it should return a 200 response with the GraphQL result

  Scenario: Handling a request with chunked response
    Given ApolloServer.executeHTTPGraphQLRequest returns a body with kind "chunked"
    When the Azure Functions handler is invoked
    Then it should return a 501 response with an error message about incremental delivery

  Scenario: Handling a request with missing HTTP method
    Given an HttpRequest with no method property
    When the Azure Functions handler is invoked
    Then it should return a 400 response with an error message about missing method

  Scenario: Handling a request that throws an error
    Given ApolloServer.executeHTTPGraphQLRequest throws an error
    When the Azure Functions handler is invoked
    Then it should log the error to the InvocationContext
    And it should return a 400 response with the error message
