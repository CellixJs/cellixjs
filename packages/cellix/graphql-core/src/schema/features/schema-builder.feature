Feature: Schema Builder

  Scenario: Building schema with no additional types or resolvers
    Given no additional type definitions or resolvers
    When buildCellixSchema is called
    Then it should return a valid GraphQL schema
    And the schema should include base Cellix types
    And the schema should include GraphQL scalars

  Scenario: Building schema with additional string type definitions
    Given additional type definitions as strings
    When buildCellixSchema is called with the additional types
    Then it should return a valid GraphQL schema
    And the schema should include the additional types

  Scenario: Building schema with additional resolvers
    Given additional resolvers
    When buildCellixSchema is called with the additional resolvers
    Then it should return a valid GraphQL schema
    And the schema should include the additional resolvers

  Scenario: Loading resolvers from glob pattern
    Given a glob pattern for resolver files
    When loadResolversFromGlob is called
    Then it should return merged resolvers from the matched files