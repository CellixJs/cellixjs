Feature: Persistence Factory

  Background:
    Given a valid Mongoose context factory with service
    And the Models.mongooseContextBuilder is available

  Scenario: Creating Persistence factory with valid service
    When I call Persistence with a valid MongooseContextFactory
    Then I should receive a DataSourcesFactory object
    And the factory should have withPassport method
    And the factory should have withSystemPassport method

  Scenario: Creating Persistence factory without service
    When I call Persistence with null service
    Then I should receive an error about required service

  Scenario: Creating Persistence factory with undefined service
    When I call Persistence with undefined service
    Then I should receive an error about required service

  Scenario: Persistence function exports
    Then Persistence should be exported from index
    And ModelsContext type should be exported from index
    And DataSources type should be exported from index
    And DataSourcesFactory type should be exported from index