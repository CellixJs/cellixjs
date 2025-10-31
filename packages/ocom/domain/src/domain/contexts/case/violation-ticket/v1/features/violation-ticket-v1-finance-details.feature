Feature: <Entity> ViolationTicketV1FinanceDetails

  Scenario: Creating a new ViolationTicketV1FinanceDetails instance
    When I create a new ViolationTicketV1FinanceDetails with valid properties
    Then the instance should be created successfully
    And the service fee should be set correctly
    And the transactions should be set correctly
    And the revenue recognition should be set correctly

  Scenario: Setting service fee
    When I have a ViolationTicketV1FinanceDetails instance
    And I set the service fee
    Then the service fee should be updated