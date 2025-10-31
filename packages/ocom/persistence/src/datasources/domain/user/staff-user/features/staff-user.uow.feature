Feature: <UnitOfWork> StaffUserUnitOfWork

  Scenario: Creating a staff user unit of work
    Given a valid StaffUser model and passport
    When I call getStaffUserUnitOfWork with the model and passport
    Then I should receive a properly initialized StaffUserUnitOfWork
    And the Unit of Work should have the correct repository type
    And the Unit of Work should have the correct converter type
    And the Unit of Work should have the correct event buses
