Feature: Staff User Resolvers

  As an API consumer
  I want to query and manage staff users and roles
  So that I can administer the system via the GraphQL API

  # ─── currentStaffUserAndCreateIfNotExists ────────────────────────────────────

  Scenario: Querying the current staff user and creating if not exists
    Given a user with a verifiedJwt in their context
    When the currentStaffUserAndCreateIfNotExists query is executed
    Then it should call User.StaffUser.createIfNotExists with the JWT claims
    And it should return the corresponding StaffUser entity

  Scenario: Querying the current staff user with AAD roles
    Given a user with a verifiedJwt that includes AAD roles in their context
    When the currentStaffUserAndCreateIfNotExists query is executed
    Then it should call User.StaffUser.createIfNotExists with the AAD roles
    And it should return the corresponding StaffUser entity

  Scenario: Querying the current staff user with no JWT
    Given a user without a verifiedJwt in their context
    When the currentStaffUserAndCreateIfNotExists query is executed
    Then it should throw an "Unauthorized" error

  # ─── staffUsers ──────────────────────────────────────────────────────────────

  Scenario: Listing staff users when authenticated
    Given a user with a verifiedJwt in their context
    When the staffUsers query is executed
    Then it should return the list of staff users

  Scenario: Listing staff users when unauthenticated
    Given a user without a verifiedJwt in their context
    When the staffUsers query is executed
    Then it should throw an "Unauthorized" error

  # ─── staffRoles ──────────────────────────────────────────────────────────────

  Scenario: Listing staff roles when authenticated
    Given a user with a verifiedJwt in their context
    When the staffRoles query is executed
    Then it should call createDefaultRoles
    And it should return the list of staff roles

  Scenario: Listing staff roles when unauthenticated
    Given a user without a verifiedJwt in their context
    When the staffRoles query is executed
    Then it should throw an "Unauthorized" error

  # ─── staffRoleById ───────────────────────────────────────────────────────────

  Scenario: Querying a staff role by id when authenticated
    Given a user with a verifiedJwt in their context
    When the staffRoleById query is executed with id "role-001"
    Then it should return the staff role with id "role-001"

  Scenario: Querying a staff role by id when unauthenticated
    Given a user without a verifiedJwt in their context
    When the staffRoleById query is executed with id "role-001"
    Then it should throw an "Unauthorized" error

  # ─── staffUserById ───────────────────────────────────────────────────────────

  Scenario: Querying a staff user by id when the user exists
    Given a user with a verifiedJwt in their context
    When the staffUserById query is executed with id "user-001"
    Then it should return the staff user with id "user-001"

  Scenario: Querying a staff user by id when the user does not exist
    Given a user with a verifiedJwt in their context
    When the staffUserById query is executed with id "user-missing"
    Then it should return null

  Scenario: Querying a staff user by id when unauthenticated
    Given a user without a verifiedJwt in their context
    When the staffUserById query is executed with id "user-001"
    Then it should throw an "Unauthorized" error

  # ─── staffRoleCreate ─────────────────────────────────────────────────────────

  Scenario: Creating a staff role as TechAdmin
    Given a user with a verifiedJwt that includes the TechAdmin role
    When the staffRoleCreate mutation is executed with roleName "New Role" and enterpriseAppRole "Staff.CaseManager"
    Then it should return success with the created staff role

  Scenario: Creating a staff role with an unauthorized enterpriseAppRole
    Given a user with a verifiedJwt that includes the CaseManager role
    When the staffRoleCreate mutation is executed with roleName "New Role" and enterpriseAppRole "Staff.TechAdmin"
    Then it should return failure with a permission error message

  Scenario: Creating a staff role when unauthenticated
    Given a user without a verifiedJwt in their context
    When the staffRoleCreate mutation is executed with roleName "New Role" and enterpriseAppRole "Staff.CaseManager"
    Then it should return failure with message "Unauthorized"

  Scenario: Creating a staff role when the service throws
    Given a user with a verifiedJwt that includes the TechAdmin role
    When the staffRoleCreate mutation throws an error
    Then it should return failure with the error message

  # ─── staffRoleUpdate ─────────────────────────────────────────────────────────

  Scenario: Updating a staff role as TechAdmin
    Given a user with a verifiedJwt that includes the TechAdmin role
    When the staffRoleUpdate mutation is executed with id "role-001" and enterpriseAppRole "Staff.TechAdmin"
    Then it should return success with the updated staff role

  Scenario: Updating a staff role with an unauthorized enterpriseAppRole
    Given a user with a verifiedJwt that includes the CaseManager role
    When the staffRoleUpdate mutation is executed with id "role-001" and enterpriseAppRole "Staff.TechAdmin"
    Then it should return failure with a permission error message

  Scenario: Updating a staff role when unauthenticated
    Given a user without a verifiedJwt in their context
    When the staffRoleUpdate mutation is executed with id "role-001" and enterpriseAppRole "Staff.TechAdmin"
    Then it should return failure with message "Unauthorized"

  # ─── staffUserAssignRole ─────────────────────────────────────────────────────

  Scenario: Assigning a role as TechAdmin bypasses role-type check
    Given a user with a verifiedJwt that includes the TechAdmin role
    When the staffUserAssignRole mutation is executed with staffUserId "user-001" and roleId "role-001"
    Then it should return success with the updated staff user

  Scenario: Assigning an allowed role as non-TechAdmin
    Given a user with a verifiedJwt that includes the CaseManager role
    And the role "role-001" has enterpriseAppRole "Staff.CaseManager"
    When the staffUserAssignRole mutation is executed with staffUserId "user-001" and roleId "role-001"
    Then it should return success with the updated staff user

  Scenario: Assigning a forbidden role as non-TechAdmin
    Given a user with a verifiedJwt that includes the CaseManager role
    And the role "role-001" has enterpriseAppRole "Staff.TechAdmin"
    When the staffUserAssignRole mutation is executed with staffUserId "user-001" and roleId "role-001"
    Then it should return failure with a permission error message

  Scenario: Assigning a role when unauthenticated
    Given a user without a verifiedJwt in their context
    When the staffUserAssignRole mutation is executed with staffUserId "user-001" and roleId "role-001"
    Then it should return failure with message "Unauthorized"

  # ─── staffUserCreate ─────────────────────────────────────────────────────────

  Scenario: Creating a staff user when caller has canManageUsers permission
    Given a user with canManageUsers permission
    When the staffUserCreate mutation is executed with firstName "Alice" lastName "Wonder" and email "alice@example.com"
    Then it should return success with the created staff user

  Scenario: Creating a staff user when caller lacks permission
    Given a user with no user-management permissions
    When the staffUserCreate mutation is executed with firstName "Alice" lastName "Wonder" and email "alice@example.com"
    Then it should return failure with message "Unauthorized"

  Scenario: Creating a staff user with a role as TechAdmin
    Given a user with a verifiedJwt that includes the TechAdmin role
    And the caller has canManageUsers permission
    When the staffUserCreate mutation is executed with a roleId "role-001"
    Then it should return success with the created staff user

  Scenario: Creating a staff user with a forbidden role as non-TechAdmin
    Given a user with a verifiedJwt that includes the CaseManager role
    And the caller has canManageUsers permission
    And the role "role-001" has enterpriseAppRole "Staff.TechAdmin"
    When the staffUserCreate mutation is executed with a roleId "role-001"
    Then it should return failure with a permission error message

  Scenario: Creating a staff user when unauthenticated
    Given a user without a verifiedJwt in their context
    When the staffUserCreate mutation is executed with firstName "Alice" lastName "Wonder" and email "alice@example.com"
    Then it should return failure with message "Unauthorized"
