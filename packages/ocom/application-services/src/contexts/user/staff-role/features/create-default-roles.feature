Feature: Creating default staff roles

  Scenario: Creates all four default roles when none exist
    Given no staff roles exist
    When I call createDefaultRoles
    Then it should create all four roles: "Staff.CaseManager", "Staff.ServiceLineOwner", "Staff.Finance", "Staff.TechAdmin"
    And it should return all four created role references

  Scenario: Skips roles that already exist
    Given the role "Staff.CaseManager" already exists
    When I call createDefaultRoles
    Then it should only create the three missing roles
    And it should not attempt to create "Staff.CaseManager" again

  Scenario: Returns empty array when all roles already exist
    Given all four default roles already exist
    When I call createDefaultRoles
    Then it should return an empty array
    And it should not call getNewInstance or save

  Scenario: CaseManager role has correct permissions
    Given no staff roles exist
    When I call createDefaultRoles
    Then the "Staff.CaseManager" role should have canManageCommunities true
    And the "Staff.CaseManager" role should have canManageFinance false
    And the "Staff.CaseManager" role should have canManageTechAdmin false
    And the "Staff.CaseManager" role should have canManageUsers true

  Scenario: Finance role has correct permissions
    Given no staff roles exist
    When I call createDefaultRoles
    Then the "Staff.Finance" role should have canManageCommunities false
    And the "Staff.Finance" role should have canManageFinance true
    And the "Staff.Finance" role should have canManageTechAdmin false
    And the "Staff.Finance" role should have canManageUsers false

  Scenario: TechAdmin role has correct permissions
    Given no staff roles exist
    When I call createDefaultRoles
    Then the "Staff.TechAdmin" role should have canManageCommunities false
    And the "Staff.TechAdmin" role should have canManageFinance false
    And the "Staff.TechAdmin" role should have canManageTechAdmin true
    And the "Staff.TechAdmin" role should have canManageUsers false

  Scenario: ServiceLineOwner role has correct permissions
    Given no staff roles exist
    When I call createDefaultRoles
    Then the "Staff.ServiceLineOwner" role should have canManageCommunities true
    And the "Staff.ServiceLineOwner" role should have canManageFinance false
    And the "Staff.ServiceLineOwner" role should have canManageTechAdmin false
    And the "Staff.ServiceLineOwner" role should have canManageUsers true

  Scenario: All created roles have isDefault set to false
    Given no staff roles exist
    When I call createDefaultRoles
    Then all created roles should have isDefault false

  Scenario: Propagates unexpected repository errors
    Given no staff roles exist
    When the repository throws an unexpected error
    Then createDefaultRoles should propagate the error
