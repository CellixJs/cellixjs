Feature: Creating default staff roles

  Scenario: Creates all four default roles when none exist
    Given no staff roles exist
    When I call createDefaultRoles
    Then it should create all four roles: "Default.CaseManager", "Default.ServiceLineOwner", "Default.Finance", "Default.TechAdmin"
    And it should return all four created role references

  Scenario: Skips roles that already exist
    Given the role "Default.CaseManager" already exists
    When I call createDefaultRoles
    Then it should only create the three missing roles
    And it should not attempt to create "Default.CaseManager" again

  Scenario: Returns empty array when all roles already exist
    Given all four default roles already exist
    When I call createDefaultRoles
    Then it should return an empty array
    And it should not call getNewInstance or save

  Scenario: CaseManager role has correct permissions
    Given no staff roles exist
    When I call createDefaultRoles
    Then the "Default.CaseManager" role should have canManageCommunities true
    And the "Default.CaseManager" role should have canManageFinance false
    And the "Default.CaseManager" role should have canManageTechAdmin false
    And the "Default.CaseManager" role should have canManageUsers true

  Scenario: Finance role has correct permissions
    Given no staff roles exist
    When I call createDefaultRoles
    Then the "Default.Finance" role should have canManageCommunities false
    And the "Default.Finance" role should have canManageFinance true
    And the "Default.Finance" role should have canManageTechAdmin false
    And the "Default.Finance" role should have canManageUsers false

  Scenario: TechAdmin role has correct permissions
    Given no staff roles exist
    When I call createDefaultRoles
    Then the "Default.TechAdmin" role should have canManageCommunities true
    And the "Default.TechAdmin" role should have canManageFinance true
    And the "Default.TechAdmin" role should have canManageTechAdmin true
    And the "Default.TechAdmin" role should have canManageUsers true

  Scenario: ServiceLineOwner role has correct permissions
    Given no staff roles exist
    When I call createDefaultRoles
    Then the "Default.ServiceLineOwner" role should have canManageCommunities true
    And the "Default.ServiceLineOwner" role should have canManageFinance false
    And the "Default.ServiceLineOwner" role should have canManageTechAdmin false
    And the "Default.ServiceLineOwner" role should have canManageUsers true

  Scenario: All created roles have isDefault set to true
    Given no staff roles exist
    When I call createDefaultRoles
    Then all created roles should have isDefault true

  Scenario: Propagates unexpected repository errors
    Given no staff roles exist
    When the repository throws an unexpected error
    Then createDefaultRoles should propagate the error
