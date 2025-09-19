Feature: <Persistence> MemberPersistence

  Background:
    Given a valid models context with Member model
    And a valid passport for domain operations

  Scenario: Creating Member Persistence
    When I call MemberPersistence with models and passport
    Then I should receive an object with MemberUnitOfWork property
    And the MemberUnitOfWork should be properly initialized