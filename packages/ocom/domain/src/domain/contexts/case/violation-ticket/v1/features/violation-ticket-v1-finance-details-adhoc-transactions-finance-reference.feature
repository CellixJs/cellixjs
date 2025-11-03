Feature: Violation Ticket V1 Finance Details Adhoc Transactions Finance Reference

  Scenario: Creating a new ViolationTicketV1FinanceDetailsAdhocTransactionsFinanceReference instance
    When I create a new ViolationTicketV1FinanceDetailsAdhocTransactionsFinanceReference with valid properties
    Then the debit GL account should be accessible
    And the credit GL account should be accessible
    And the completed on date should be accessible

  Scenario: Setting debit GL account
    Given I have a ViolationTicketV1FinanceDetailsAdhocTransactionsFinanceReference instance
    When I set the debit GL account to "3000"
    Then the debit GL account should be "3000"

  Scenario: Setting credit GL account
    Given I have a ViolationTicketV1FinanceDetailsAdhocTransactionsFinanceReference instance
    When I set the credit GL account to "4000"
    Then the credit GL account should be "4000"

  Scenario: Setting completed on date
    Given I have a ViolationTicketV1FinanceDetailsAdhocTransactionsFinanceReference instance
    When I set the completed on date to a new date
    Then the completed on date should be the new date