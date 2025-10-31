Feature: <Passport> SystemCasePassport

  Background:
    Given I have case domain permissions with canCreateTickets true

  Scenario: Creating SystemCasePassport and getting visa for service ticket V1
    Given I create a SystemCasePassport with permissions
    And I have a service ticket V1 entity reference
    When I call forServiceTicketV1 with the service ticket reference
    Then it should return a ServiceTicketV1Visa
    And the visa should allow determining permissions

  Scenario: Creating SystemCasePassport and getting visa for violation ticket V1
    Given I create a SystemCasePassport with permissions
    And I have a violation ticket V1 entity reference
    When I call forViolationTicketV1 with the violation ticket reference
    Then it should return a ViolationTicketV1Visa
    And the visa should allow determining permissions

  Scenario: Creating SystemCasePassport with no permissions
    Given I create a SystemCasePassport with no permissions
    And I have a service ticket V1 entity reference
    When I call forServiceTicketV1 with the service ticket reference
    Then it should return a ServiceTicketV1Visa that works with empty permissions

  Scenario: Using visa to determine permissions for service ticket
    Given I create a SystemCasePassport with canCreateTickets permission
    And I have a service ticket V1 entity reference
    When I get a visa for the service ticket
    And I use determineIf to check if canCreateTickets is true
    Then it should return true

  Scenario: Using visa to determine permissions for violation ticket
    Given I create a SystemCasePassport with canCreateTickets permission
    And I have a violation ticket V1 entity reference
    When I get a visa for the violation ticket
    And I use determineIf to check if canCreateTickets is true
    Then it should return true