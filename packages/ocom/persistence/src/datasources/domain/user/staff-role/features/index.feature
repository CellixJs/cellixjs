Feature: <Persistence> StaffRolePersistence

  Background:
    Given a valid models context with StaffRole model
    And a valid passport for domain operations

  Scenario: Creating StaffRole Persistence
    When I call StaffRolePersistence with models and passport
    Then I should receive an object with StaffRoleUnitOfWork property
    And the StaffRoleUnitOfWork should be properly initialized

  Scenario: Creating StaffRole Persistence with missing StaffRole model
    Given a models context without StaffRole model
    When I call StaffRolePersistence with models and passport
    Then an error should be thrown indicating "StaffRole model is not available in the mongoose context"