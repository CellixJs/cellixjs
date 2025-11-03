Feature: Staff Role Application Service

  Scenario: Creating a staff role through the application service
    Given a staff role application service
    When I create a staff role with name "Test Role"
    Then it should delegate to the create function

  Scenario: Deleting and reassigning a staff role through the application service
    Given a staff role application service
    When I delete and reassign role "role1" to role "role2"
    Then it should delegate to the deleteAndReassign function

  Scenario: Querying a staff role by ID through the application service
    Given a staff role application service
    When I query for staff role with id "role1"
    Then it should delegate to the queryById function

  Scenario: Querying a staff role by name through the application service
    Given a staff role application service
    When I query for staff role with name "Test Role"
    Then it should delegate to the queryByRoleName function