Feature: Test resolvers

  Scenario: Responding with hello world
    When the hello query is executed
    Then it should return "Hello, world!"
