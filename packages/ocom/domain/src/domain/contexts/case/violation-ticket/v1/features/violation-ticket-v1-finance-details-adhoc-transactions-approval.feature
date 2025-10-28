Feature: Violation Ticket V1 Finance Details Adhoc Transactions Approval

  Scenario: Creating a new ViolationTicketV1FinanceDetailsAdhocTransactionsApproval instance
    When I create a new ViolationTicketV1FinanceDetailsAdhocTransactionsApproval with valid properties
    Then the is applicant approval required should be accessible
    And the is applicant approved should be accessible
    And the applicant responded at should be accessible

  Scenario: Setting is applicant approval required
    Given I have a ViolationTicketV1FinanceDetailsAdhocTransactionsApproval instance
    When I set the is applicant approval required to false
    Then the is applicant approval required should be false

  Scenario: Setting is applicant approved
    Given I have a ViolationTicketV1FinanceDetailsAdhocTransactionsApproval instance
    When I set the is applicant approved to true
    Then the is applicant approved should be true

  Scenario: Setting applicant responded at
    Given I have a ViolationTicketV1FinanceDetailsAdhocTransactionsApproval instance
    When I set the applicant responded at to a new date
    Then the applicant responded at should be the new date