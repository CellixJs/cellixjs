Feature: VendorUserRole Unit of Work Factory

  Background:
    Given a valid VendorUserRole model
    And a valid passport for domain operations

  Scenario: Creating VendorUserRole Unit of Work
    When I call getVendorUserRoleUnitOfWork with model and passport
    Then I should receive a VendorUserRoleUnitOfWork instance
    And the UnitOfWork should have transaction methods