Feature: Violation Ticket V1 Finance Details GL Transaction

  Scenario: Creating a new ViolationTicketV1FinanceDetailsGlTransaction instance
    When I create a new ViolationTicketV1FinanceDetailsGlTransaction with valid properties
    Then the debit GL account should be accessible
    And the credit GL account should be accessible
    And the amount should be accessible
    And the recognition date should be accessible
    And the completed on date should be accessible

  Scenario: Setting debit GL account
    Given I have a ViolationTicketV1FinanceDetailsGlTransaction instance
    When I set the debit GL account to "3000"
    Then the debit GL account should be "3000"

  Scenario: Setting credit GL account
    Given I have a ViolationTicketV1FinanceDetailsGlTransaction instance
    When I set the credit GL account to "4000"
    Then the credit GL account should be "4000"

  Scenario: Setting amount
    Given I have a ViolationTicketV1FinanceDetailsGlTransaction instance
    When I set the amount to 250.50
    Then the amount should be 250.50

  Scenario: Setting recognition date
    Given I have a ViolationTicketV1FinanceDetailsGlTransaction instance
    When I set the recognition date to a new date
    Then the recognition date should be the new date

  Scenario: Setting completed on date
    Given I have a ViolationTicketV1FinanceDetailsGlTransaction instance
    When I set the completed on date to undefined
    Then the completed on date should be undefined