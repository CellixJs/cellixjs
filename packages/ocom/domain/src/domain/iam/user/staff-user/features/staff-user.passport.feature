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
    Then an error should be thrown indicating the user passport is not available