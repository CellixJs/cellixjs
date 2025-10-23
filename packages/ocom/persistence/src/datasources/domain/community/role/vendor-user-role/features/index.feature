Feature: VendorUserRole Persistence Factory

  Background:
    Given a valid models context with VendorUserRole model
    And a valid passport for domain operations

  Scenario: Creating VendorUserRole Persistence
    When I call VendorUserRolePersistence with models and passport
    Then I should receive an object with VendorUserRoleUnitOfWork property
    And the VendorUserRoleUnitOfWork should be properly initialized