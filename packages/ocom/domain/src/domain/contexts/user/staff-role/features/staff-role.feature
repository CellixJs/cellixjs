Feature: <AggregateRoot> StaffRole

  Background:
    Given a valid Passport with staff role permissions
    And base staff role properties with roleName "Support", isDefault false, roleType "staff-role", and valid timestamps

  Scenario: Creating a new staff role instance
    When I create a new StaffRole aggregate using getNewInstance with roleName "Support" and isDefault false
    Then the staff role's roleName should be "Support"
    And the staff role's isDefault should be false

  # roleName
  Scenario: Changing the roleName with permission to manage staff roles
    Given a StaffRole aggregate with permission to manage staff roles and permissions
    When I set the roleName to "manager"
    Then the staff role's roleName should be "Manager"

  Scenario: Changing the roleName with system account permission
    Given a StaffRole aggregate with system account permission
    When I set the roleName to "manager"
    Then the staff role's roleName should be "Manager"

  Scenario: Changing the roleName without permission
    Given a StaffRole aggregate without permission to manage staff roles and permissions or system account
    When I try to set the roleName to "Manager"
    Then a PermissionError should be thrown

  Scenario: Changing the roleName to an invalid value
    Given a StaffRole aggregate with permission to manage staff roles and permissions
    When I try to set the roleName to an invalid value (e.g., empty string)
    Then an error should be thrown indicating the value is invalid

  # isDefault
  Scenario: Changing isDefault with permission to manage staff roles
    Given a StaffRole aggregate with permission to manage staff roles and permissions
    When I set isDefault to true
    Then the staff role's isDefault should be true

  Scenario: Changing isDefault with system account permission
    Given a StaffRole aggregate with system account permission
    When I set isDefault to true
    Then the staff role's isDefault should be true

  Scenario: Changing isDefault without permission
    Given a StaffRole aggregate without permission to manage staff roles and permissions or system account
    When I try to set isDefault to true
    Then a PermissionError should be thrown

  # deleteAndReassignTo
  Scenario: Deleting a non-default staff role with permission
    Given a StaffRole aggregate that is not deleted and is not default, with permission to manage staff roles and permissions
    When I call deleteAndReassignTo with a valid StaffRoleEntityReference
    Then the staff role should be marked as deleted
    And a RoleDeletedReassignEvent should be added to integration events

  Scenario: Deleting a non-default staff role without permission
    Given a StaffRole aggregate that is not deleted and is not default, without permission to manage staff roles and permissions
    When I try to call deleteAndReassignTo with a valid StaffRoleEntityReference
    Then a PermissionError should be thrown
    And no RoleDeletedReassignEvent should be emitted

  Scenario: Deleting a default staff role
    Given a StaffRole aggregate that is default
    When I try to call deleteAndReassignTo with a valid StaffRoleEntityReference
    Then a PermissionError should be thrown
    And no RoleDeletedReassignEvent should be emitted

  # permissions (delegation)
  Scenario: Accessing permissions entity
    Given a StaffRole aggregate
    When I access the permissions property
    Then I should receive a StaffRolePermissions entity instance

  # read-only properties
  Scenario: Getting roleType, createdAt, updatedAt, and schemaVersion
    Given a StaffRole aggregate
    Then the roleType property should return the correct value
    And the createdAt property should return the correct date
    And the updatedAt property should return the correct date
    And the schemaVersion property should return the correct version

  # enterpriseAppRole
  Scenario: Getting the enterpriseAppRole property
    Given a StaffRole aggregate with permission to manage staff roles and permissions
    Then the enterpriseAppRole should return the initial value

  Scenario: Changing the enterpriseAppRole with permission to manage staff roles
    Given a StaffRole aggregate with permission to manage staff roles and permissions
    When I set the enterpriseAppRole to "Staff.CaseManager"
    Then the staff role's enterpriseAppRole should be "Staff.CaseManager"

  Scenario: Changing the enterpriseAppRole with system account permission
    Given a StaffRole aggregate with system account permission
    When I set the enterpriseAppRole to "Staff.Finance"
    Then the staff role's enterpriseAppRole should be "Staff.Finance"

  Scenario: Changing the enterpriseAppRole without permission
    Given a StaffRole aggregate without permission to manage staff roles and permissions or system account
    When I try to set the enterpriseAppRole to "Staff.CaseManager"
    Then a PermissionError should be thrown for enterpriseAppRole

  Scenario: Changing the enterpriseAppRole to an invalid value
    Given a StaffRole aggregate with permission to manage staff roles and permissions
    When I try to set the enterpriseAppRole to an invalid value
    Then an error should be thrown for the invalid enterpriseAppRole

  # getDefaultRoleNames
  Scenario: Getting the list of default role names
    When I call getDefaultRoleNames
    Then it should return the four canonical default role name strings

  # default factory methods
  Scenario: Creating a new default Case Manager role
    When I call getNewDefaultCaseManagerInstance
    Then the role name should be "Default Case Manager"
    And the enterpriseAppRole should be "Staff.CaseManager"
    And isDefault should be true
    And community canManageCommunities should be true
    And community canManageStaffRolesAndPermissions should be true
    And finance canManageFinance should be false
    And techAdmin canManageTechAdmin should be false
    And user canManageUsers should be true
    And user canAssignStaffUserRoles should be true

  Scenario: Creating a new default Service Line Owner role
    When I call getNewDefaultServiceLineOwnerInstance
    Then the role name should be "Default Service Line Owner"
    And the enterpriseAppRole should be "Staff.ServiceLineOwner"
    And isDefault should be true
    And community canManageCommunities should be true
    And community canManageStaffRolesAndPermissions should be true
    And finance canManageFinance should be false
    And techAdmin canManageTechAdmin should be false
    And user canManageUsers should be true
    And user canAssignStaffUserRoles should be true

  Scenario: Creating a new default Finance role
    When I call getNewDefaultFinanceInstance
    Then the role name should be "Default Finance"
    And the enterpriseAppRole should be "Staff.Finance"
    And isDefault should be true
    And community canManageCommunities should be false
    And community canManageStaffRolesAndPermissions should be true
    And finance canManageFinance should be true
    And techAdmin canManageTechAdmin should be false
    And user canManageUsers should be true
    And user canAssignStaffUserRoles should be true

  Scenario: Creating a new default Tech Admin role
    When I call getNewDefaultTechAdminInstance
    Then the role name should be "Default Tech Admin"
    And the enterpriseAppRole should be "Staff.TechAdmin"
    And isDefault should be true
    And community canManageCommunities should be true
    And community canManageStaffRolesAndPermissions should be true
    And finance canManageFinance should be true
    And techAdmin canManageTechAdmin should be true
    And user canManageUsers should be true
    And user canAssignStaffUserRoles should be true
  # getDefaultRoleNames
  Scenario: Getting default role names
    When I call getDefaultRoleNames
    Then the result should contain "Default.CaseManager"
    And the result should contain "Default.ServiceLineOwner"
    And the result should contain "Default.Finance"
    And the result should contain "Default.TechAdmin"
    And the result should have exactly 4 names

  Scenario: Creating a default tech admin role
    When I create a default tech admin staff role
    Then the roleName should be "Default Tech Admin"
    And the enterpriseAppRole should be "Staff.TechAdmin"
    And the tech admin role should allow managing communities
    And the tech admin role should allow managing staff roles and permissions
    And the tech admin role should allow managing finance
    And the tech admin role should allow managing tech admin
    And the tech admin role should allow managing users
