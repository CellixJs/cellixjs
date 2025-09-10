Feature: <Entity> EndUserContactInformation

  Background:
    Given valid EndUserContactInformationProps with email "alice@cellix.com"
    And a valid UserVisa

  Scenario: Creating a new EndUserContactInformation instance
    When I create a new EndUserContactInformation using getNewInstance with the email
    Then the entity's email should be set to "alice@cellix.com"

  Scenario: Changing the email with permission to edit own account
    Given an EndUserContactInformation entity with permission to edit own account
    When I set the email to "bob@cellix.com"
    Then the entity's email should be "bob@cellix.com"

  Scenario: Changing the email with permission to manage end users
    Given an EndUserContactInformation entity with permission to manage end users
    When I set the email to "bob@cellix.com"
    Then the entity's email should be "bob@cellix.com"

  Scenario: Changing the email without permission
    Given an EndUserContactInformation entity without permission to edit own account or manage end users
    When I try to set the email to "bob@cellix.com"
    Then a PermissionError should be thrown

  Scenario: Changing the email to an invalid value
    Given an EndUserContactInformation entity with permission to edit own account
    When I try to set the email to "not-an-email"
    Then an error should be thrown indicating the email is invalid
