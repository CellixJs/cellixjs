Feature: <UnitOfWork> StaffRoleUnitOfWork

  Background:
    Given a Mongoose context factory with a working service
    And a valid StaffRole model from the models context
    And a valid passport for domain operations

  Scenario: Creating a StaffRole Unit of Work
    When I call getStaffRoleUnitOfWork with the StaffRole model and passport
    Then I should receive a properly initialized StaffRoleUnitOfWork
    And the Unit of Work should have the correct repository type
    And the Unit of Work should have the correct converter type
    And the Unit of Work should have the correct event buses