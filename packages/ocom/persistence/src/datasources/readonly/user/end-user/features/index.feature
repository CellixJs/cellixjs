Feature: EndUserReadRepositoryImpl EndUser Read Repository Implementation

  Background:
    Given a valid models context with EndUser model
    And a valid passport for domain operations

  Scenario: Creating End User Read Repository Implementation
    When I call EndUserReadRepositoryImpl with models and passport
    Then I should receive an object with EndUserReadRepo property
    And the EndUserReadRepo should be an EndUserReadRepository instance
    And the EndUserReadRepo should have all required methods

  Scenario: EndUserReadRepositoryImpl exports
    Then EndUserReadRepositoryImpl should be exported from index
    And EndUserReadRepository type should be exported from index