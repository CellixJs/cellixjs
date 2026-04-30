Feature: <UnitOfWork> MemberInvitationUnitOfWork

  Background:
    Given a valid MemberInvitation Mongoose model
    And a valid passport for domain operations

  Scenario: Creating a MemberInvitation Unit of Work
    When I call getMemberInvitationUnitOfWork with the MemberInvitation model and passport
    Then I should receive a properly initialized MemberInvitationUnitOfWork
    And the Unit of Work should have the correct repository type
    And the Unit of Work should have the correct converter type
    And the Unit of Work should have the correct event buses
