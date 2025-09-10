Feature: httpInstrumentationConfig

  Scenario: Ignoring incoming OPTIONS requests
    Given an incoming HTTP request with method OPTIONS
    When ignoreIncomingRequestHook is called
    Then it should return true

  Scenario: Not ignoring incoming GET requests
    Given an incoming HTTP request with method GET
    When ignoreIncomingRequestHook is called
    Then it should return false

  Scenario: Ignoring outgoing requests to /api/graphql
    Given an outgoing HTTP request with path starting with /api/graphql
    When ignoreOutgoingRequestHook is called
    Then it should return true

  Scenario: Not ignoring outgoing requests to other paths
    Given an outgoing HTTP request with path /api/other
    When ignoreOutgoingRequestHook is called
    Then it should return false

  Scenario: Not ignoring outgoing requests with undefined path
    Given an outgoing HTTP request with no path property
    When ignoreOutgoingRequestHook is called
    Then it should return false
