Feature: CommunityReadRepositoryImpl

  Background:
    Given a valid models context with Community model
    And a valid passport for domain operations

  Scenario: Creating Community Read Repository Implementation
    When I call CommunityReadRepositoryImpl with models and passport
    Then I should receive a CommunityReadRepositoryImpl object
    And the CommunityReadRepositoryImpl should have CommunityReadRepo property
    And the CommunityReadRepo should be a CommunityReadRepository instance