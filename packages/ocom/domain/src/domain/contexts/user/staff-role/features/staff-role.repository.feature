Feature: <Interface> StaffRoleRepository contract

  Background:
    Given a mock implementation of StaffRoleRepository that satisfies the full interface

  Scenario: getNewInstance resolves with a StaffRole for the given name
    When I call getNewInstance with name "Supervisor"
    Then it should resolve with a StaffRole whose roleName is "Supervisor"
    And the StaffRole isDefault should be false

  Scenario: getNewDefaultCaseManagerInstance resolves with a default CaseManager role
    When I call getNewDefaultCaseManagerInstance
    Then it should resolve with a StaffRole whose roleName is "Default Case Manager"
    And the StaffRole isDefault should be true

  Scenario: getNewDefaultServiceLineOwnerInstance resolves with a default ServiceLineOwner role
    When I call getNewDefaultServiceLineOwnerInstance
    Then it should resolve with a StaffRole whose roleName is "Default Service Line Owner"
    And the StaffRole isDefault should be true

  Scenario: getNewDefaultFinanceInstance resolves with a default Finance role
    When I call getNewDefaultFinanceInstance
    Then it should resolve with a StaffRole whose roleName is "Default Finance"
    And the StaffRole isDefault should be true

  Scenario: getNewDefaultTechAdminInstance resolves with a default TechAdmin role
    When I call getNewDefaultTechAdminInstance
    Then it should resolve with a StaffRole whose roleName is "Default Tech Admin"
    And the StaffRole isDefault should be true

  Scenario: getById resolves with a StaffRole for a known id
    When I call getById with "role-1"
    Then it should resolve with a StaffRole whose id is "role-1"

  Scenario: getByRoleName resolves with a StaffRole for a known roleName
    When I call getByRoleName with "Manager"
    Then it should resolve with a StaffRole whose roleName is "Manager"

  Scenario: getDefaultRoleByEnterpriseAppRole resolves with a default StaffRole
    When I call getDefaultRoleByEnterpriseAppRole with "Staff.CaseManager"
    Then it should resolve with a StaffRole whose isDefault is true
