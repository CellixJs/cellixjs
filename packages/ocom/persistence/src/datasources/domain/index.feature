Feature: <DataSource> DomainDataSourceImplementation

  Background:
    Given a valid models context with all domain models
    And a valid passport for domain operations

  Scenario: Creating Domain Data Source Implementation
    When I call DomainDataSourceImplementation with models and passport
    Then I should receive a DomainDataSource object
    And the DomainDataSource should have Community property
    And the DomainDataSource should have Property property
    And the DomainDataSource should have Service property
    And the DomainDataSource should have User property
    And the Community property should have the correct structure
    And the User property should have the correct structure
    And the Service property should have the correct structure
