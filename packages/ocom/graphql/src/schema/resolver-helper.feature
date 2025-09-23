Feature: getRequestedFieldPaths utility

  As a developer
  I want to extract all requested leaf field paths from a GraphQLResolveInfo object
  So that I can efficiently select only the necessary fields in my data layer

  Scenario: Extracting simple top-level fields
    Given a GraphQLResolveInfo for a query requesting "id" and "name"
    When getRequestedFieldPaths is called
    Then it should return ["id", "name"]

  Scenario: Extracting nested fields
    Given a GraphQLResolveInfo for a query requesting "user { id name }"
    When getRequestedFieldPaths is called
    Then it should return ["user.id", "user.name"]

  Scenario: Extracting fields with fragments
    Given a GraphQLResolveInfo for a query requesting "user { ...UserFields }" and fragment "fragment UserFields on User { id name }"
    When getRequestedFieldPaths is called
    Then it should return ["user.id", "user.name"]

  Scenario: Extracting fields with inline fragments
    Given a GraphQLResolveInfo for a query requesting "user { ... on User { id name } }"
    When getRequestedFieldPaths is called
    Then it should return ["user.id", "user.name"]

  Scenario: Skipping __typename meta field
    Given a GraphQLResolveInfo for a query requesting "id" and "__typename"
    When getRequestedFieldPaths is called
    Then it should return ["id"]
