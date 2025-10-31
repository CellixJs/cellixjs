Feature: <Persistence> VendorUserPersistence

  Background:
    Given a valid models context with VendorUser model
    And a valid passport for domain operations

  Scenario: Creating VendorUser Persistence
    When I call VendorUserPersistence with models and passport
    Then I should receive an object with VendorUserUnitOfWork property
    And the VendorUserUnitOfWork should be properly initialized