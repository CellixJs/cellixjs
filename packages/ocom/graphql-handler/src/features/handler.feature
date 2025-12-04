Feature: GraphQL Handler Creator

  Scenario: Creating a handler with valid services
    Given a ServiceApolloServer instance
    And an ApplicationServicesFactory instance
    When graphHandlerCreator is called
    Then it should return an Azure Functions HttpHandler

  Scenario: Handler extracts authorization header
    Given a ServiceApolloServer instance
    And an ApplicationServicesFactory instance
    And an HttpRequest with Authorization header "Bearer token123"
    When the created handler is invoked
    Then it should call ApplicationServicesFactory.forRequest with auth header "Bearer token123"

  Scenario: Handler extracts principal hints from headers
    Given a ServiceApolloServer instance
    And an ApplicationServicesFactory instance
    And an HttpRequest with x-member-id "member123" and x-community-id "community456"
    When the created handler is invoked
    Then it should call ApplicationServicesFactory.forRequest with principal hints containing memberId "member123" and communityId "community456"

  Scenario: Handler creates context with application services
    Given a ServiceApolloServer instance
    And an ApplicationServicesFactory that returns mock application services
    When the created handler is invoked
    Then the GraphQL context should contain the application services