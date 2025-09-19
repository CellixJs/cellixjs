Feature: <UnitOfWork> CommunityUnitOfWork

  Background:
    Given a Mongoose context factory with a working service
    And a valid Community model from the models context
    And a valid passport for domain operations

  Scenario: Creating a Community Unit of Work
    When I call getCommunityUnitOfWork with the Community model and passport
    Then I should receive a properly initialized CommunityUnitOfWork
    And the Unit of Work should have the correct repository type
    And the Unit of Work should have the correct converter type
    And the Unit of Work should have the correct event buses