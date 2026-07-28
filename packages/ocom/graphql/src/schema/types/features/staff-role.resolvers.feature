Feature: StaffRole resolvers

  Scenario: Deleting a staff role successfully
    Given a staff user with a verified JWT
    When the staffRoleDelete mutation is executed for role "607f1f77bcf86cd799439099"
    Then it should call User.StaffRole.delete with the role id, initiating staff user id, and current role id
    And it should return a success status

  Scenario: Reporting pending reassignment after a committed deletion
    Given a staff user with a verified JWT
    And the role deletion commits while reassignment remains pending
    When the staffRoleDelete mutation is executed for role "607f1f77bcf86cd799439099"
    Then it should return a success status with a reassignment warning

  Scenario: Unauthorized staff role deletion
    Given a request without a verified JWT
    When the staffRoleDelete mutation is executed without authentication
    Then it should return an unauthorized failure status
    And it should not call User.StaffRole.delete

  Scenario: Staff role deletion error handling
    Given a staff user with a verified JWT
    And the delete application service rejects with "You do not have permission to delete this role"
    When the staffRoleDelete mutation is executed for role "607f1f77bcf86cd799439099"
    Then it should return a failure status with the error message
