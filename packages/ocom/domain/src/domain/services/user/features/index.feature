Feature: <Export> User Services Index

  Scenario: Exporting StaffRoleDeletedReassignmentService
    Given the user services index module
    When I import the User export
    Then it should expose a StaffRoleDeletedReassignmentService instance
