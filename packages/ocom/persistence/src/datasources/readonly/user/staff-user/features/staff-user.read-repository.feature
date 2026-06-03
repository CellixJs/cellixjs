Feature: StaffUserReadRepository

  Scenario: Creating StaffUserReadRepository throws when StaffUser model is missing
    Given models context does not contain a StaffUser model
    When I call getStaffUserReadRepository with those models and a passport
    Then it should throw an error with message "StaffUser model is not available in the mongoose context"

  Scenario: Creating StaffUserReadRepository succeeds when StaffUser model is present
    Given models context contains a StaffUser model
    When I call getStaffUserReadRepository with those models and a passport
    Then I should receive a StaffUserReadRepository instance
    And the repository should have a getByExternalId method

  Scenario: getByExternalId returns entity when document is found
    Given a StaffUser document exists with externalId "ext-abc"
    When I call getByExternalId with "ext-abc"
    Then I should receive a StaffUserEntityReference object
    And the converter toDomain should have been called with the document and passport

  Scenario: getByExternalId returns null when no document is found
    Given no StaffUser document exists with externalId "missing-ext"
    When I call getByExternalId with "missing-ext"
    Then I should receive null
