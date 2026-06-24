Feature: StaffRoleReadRepository

  Scenario: Creating StaffRoleReadRepository throws when StaffRole model is missing
    Given models context does not contain a StaffRole model
    When I call getStaffRoleReadRepository with those models and a passport
    Then it should throw an error with message "StaffRole model is not available in the mongoose context"

  Scenario: Creating StaffRoleReadRepository succeeds when StaffRole model is present
    Given models context contains a StaffRole model
    When I call getStaffRoleReadRepository with those models and a passport
    Then I should receive a StaffRoleReadRepository instance
    And the repository should have a getAll method
    And the repository should have a getById method

  Scenario: getAll returns a list of entities when documents are found
    Given StaffRole documents exist in the collection
    When I call getAll
    Then I should receive an array of StaffRoleEntityReference objects
    And the converter toDomain should have been called for each document

  Scenario: getAll returns an empty array when no documents exist
    Given no StaffRole documents exist in the collection
    When I call getAll
    Then I should receive an empty array

  Scenario: getById returns an entity when a document is found
    Given a StaffRole document exists with id "role-001"
    When I call getById with "role-001"
    Then I should receive a StaffRoleEntityReference object
    And the converter toDomain should have been called with the document and passport

  Scenario: getById returns null when no document is found
    Given no StaffRole document exists with id "missing-id"
    When I call getById with "missing-id"
    Then I should receive null
