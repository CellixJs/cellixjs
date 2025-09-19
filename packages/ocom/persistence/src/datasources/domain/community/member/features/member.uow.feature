Feature: <UnitOfWork> MemberUnitOfWork

  Background:
    Given a Mongoose context factory with a working service
    And a valid Member model from the models context
    And a valid passport for domain operations

  Scenario: Creating a Member Unit of Work
    When I call getMemberUnitOfWork with the Member model and passport
    Then I should receive a properly initialized MemberUnitOfWork
    And the Unit of Work should have the correct repository type
    And the Unit of Work should have the correct converter type
    And the Unit of Work should have the correct event buses