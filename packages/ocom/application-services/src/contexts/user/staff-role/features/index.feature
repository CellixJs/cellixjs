Feature: Staff Role Application Service

  Scenario: Creating a staff role through the application service
    Given a staff role application service
    When I create a staff role with name "Test Role"
    Then it should delegate to the create function

  Scenario: Deleting a staff role through the application service
    Given a staff role application service
    When I delete role "role1"
    Then it should delegate to the delete function

  Scenario: Querying a staff role by ID through the application service
    Given a staff role application service
    When I query for staff role with id "role1"
    Then it should delegate to the queryById function

  Scenario: Querying a staff role by name through the application service
    Given a staff role application service
    When I query for staff role with name "Test Role"
    Then it should delegate to the queryByRoleName function