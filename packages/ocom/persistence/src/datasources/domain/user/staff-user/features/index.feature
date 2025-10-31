Feature: <Persistence> StaffUserPersistence

  Background:
    Given a valid models context with StaffUser model
    And a valid passport for domain operations

  Scenario: Creating StaffUser Persistence
    When I call StaffUserPersistence with models and passport
    Then I should receive an object with StaffUserUnitOfWork property
    And the StaffUserUnitOfWork should be properly initialized

  Scenario: Creating StaffUser Persistence with missing StaffUser model
    Given a models context without StaffUser model
    When I call StaffUserPersistence with models and passport
    Then an error should be thrown indicating "StaffUser model is not available in the mongoose context"