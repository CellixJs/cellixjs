Feature: <DataSource> ReadonlyDataSourceImplementation

  Background:
    Given a valid models context with all readonly models
    And a valid passport for domain operations

  Scenario: Creating Readonly Data Source Implementation
    When I call ReadonlyDataSourceImplementation with models and passport
    Then I should receive a ReadonlyDataSource object
    And the ReadonlyDataSource should have Community property
    And the ReadonlyDataSource should have User property
    And the Community property should have the correct structure
    And the User property should have the correct structure