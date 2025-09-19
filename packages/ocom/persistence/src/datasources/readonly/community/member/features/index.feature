Feature: MemberReadRepositoryImpl Member Read Repository Implementation

  Background:
    Given a valid models context with Member model
    And a valid passport for domain operations

  Scenario: Creating Member Read Repository Implementation
    When I call MemberReadRepositoryImpl with models and passport
    Then I should receive an object with MemberReadRepo property
    And the MemberReadRepo should be a MemberReadRepository instance
    And the MemberReadRepo should have all required methods

  Scenario: MemberReadRepositoryImpl exports
    Then MemberReadRepositoryImpl should be exported from index
    And MemberReadRepository type should be exported from index