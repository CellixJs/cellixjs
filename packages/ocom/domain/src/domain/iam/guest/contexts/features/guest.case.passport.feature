Feature: GuestCasePassport

  Scenario: Creating GuestCasePassport and getting visa for service ticket V1
    When I create a GuestCasePassport
    And I have a service ticket V1 entity reference
    And I call forServiceTicketV1 with the service ticket reference
    Then it should return a visa that denies all permissions

  Scenario: Creating GuestCasePassport and getting visa for violation ticket V1
    When I create a GuestCasePassport
    And I have a violation ticket V1 entity reference
    And I call forViolationTicketV1 with the violation ticket reference
    Then it should return a visa that denies all permissions