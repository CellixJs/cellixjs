Feature: <Passport> StaffUserPassport

  Background:
    Given a valid StaffUserEntityReference

  Scenario: Creating a StaffUserPassport with valid staff user 
    When I create a StaffUserPassport with the staff user
    Then the passport should be created successfully

  Scenario: Accessing the community passport
    When I create a StaffUserPassport with valid staff user
    And I access the community property
    Then I should receive a StaffUserCommunityPassport instance with all visas

  Scenario: Accessing the service passport
    When I create a StaffUserPassport with valid staff user
    And I access the service property
    Then an error should be thrown indicating the service passport is not available

  Scenario: Accessing the user passport
    When I create a StaffUserPassport with valid staff user
    And I access the user property
    Then I should receive a StaffUserUserPassport instance

  Scenario: Accessing the case passport
    When I create a StaffUserPassport with valid staff user
    And I access the case property
    Then I should receive a StaffUserCasePassport instance

  Scenario: The case passport forServiceTicketV1 returns a StaffUserServiceTicketVisa
    When I create a StaffUserPassport with valid staff user
    And I access the case property
    Then forServiceTicketV1 should return a StaffUserServiceTicketVisa

  Scenario: The case passport forViolationTicketV1 returns a StaffUserViolationTicketVisa
    When I create a StaffUserPassport with valid staff user
    And I access the case property
    Then forViolationTicketV1 should return a StaffUserViolationTicketVisa

  Scenario: Accessing the property passport
    When I create a StaffUserPassport with valid staff user
    And I access the property property
    Then I should receive a StaffUserPropertyPassport instance

  Scenario: The property passport forProperty returns a visa that always denies
    When I create a StaffUserPassport with valid staff user
    And I access the property property
    Then forProperty should return a visa whose determineIf always returns false

  Scenario: Community passport is cached after first access
    When I create a StaffUserPassport with valid staff user
    And I access the community property twice
    Then both accesses should return the same instance

  Scenario: Case passport is cached after first access
    When I create a StaffUserPassport with valid staff user
    And I access the case property twice
    Then both accesses should return the same instance

  Scenario: Property passport is cached after first access
    When I create a StaffUserPassport with valid staff user
    And I access the property property twice
    Then both accesses should return the same instance

  Scenario: User passport is cached after first access
    When I create a StaffUserPassport with valid staff user
    And I access the user property twice
    Then both accesses should return the same instance