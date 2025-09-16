Feature: DataSources DataSourcesFactoryImpl

  Background:
    Given a valid models context with all domain and readonly models
    And a valid passport for domain operations

  Scenario: Creating Data Sources Factory Implementation
    When I call DataSourcesFactoryImpl with models
    Then I should receive a DataSourcesFactory object
    And the DataSourcesFactory should have withPassport method
    And the DataSourcesFactory should have withSystemPassport method

  Scenario: Using withPassport method
    When I call withPassport with a passport
    Then I should receive a DataSources object
    And the DataSources should have domainDataSource property
    And the DataSources should have readonlyDataSource property

  Scenario: Using withSystemPassport method
    When I call withSystemPassport
    Then I should receive a DataSources object with system passport
    And the DataSources should have domainDataSource property
    And the DataSources should have readonlyDataSource property

  Scenario: DataSourcesFactoryImpl exports
    Then DataSourcesFactoryImpl should be exported from index
    And DataSources type should be exported from index
    And DataSourcesFactory type should be exported from index