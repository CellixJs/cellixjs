Feature: <Visa> MemberViolationTicketVisa

  Background:
    Given a valid ViolationTicketV1EntityReference with id "ticket-1", communityId "community-1", requestorId "member-1", assignedToId "member-2"
    And a valid MemberEntityReference with id "member-1", community id "community-1", and role with community permissions

  Scenario: Creating a MemberViolationTicketVisa with a member belonging to the community
    When I create a MemberViolationTicketVisa with the ticket and member
    Then the visa should be created successfully

  Scenario: determineIf returns true when the permission function returns true
    Given a MemberViolationTicketVisa for the ticket and member
    When I call determineIf with a function that returns true if canCreateTickets is true
    Then the result should be true

  Scenario: determineIf returns false when the permission function returns false
    Given a MemberViolationTicketVisa for the ticket and member
    When I call determineIf with a function that returns false
    Then the result should be false

  Scenario: determineIf returns false if the member does not belong to the community
    Given a MemberEntityReference with community id "community-2"
    And a ViolationTicketV1EntityReference with communityId "community-1"
    When I create a MemberViolationTicketVisa with the ticket and member
    And I call determineIf with any function
    Then the result should be false

  Scenario: determineIf sets canCreateTickets to true
    Given a MemberViolationTicketVisa for the ticket and member
    When I call determineIf with a function that returns canCreateTickets
    Then the result should be true

  Scenario: determineIf sets canManageTickets to false
    Given a MemberViolationTicketVisa for the ticket and member
    When I call determineIf with a function that returns canManageTickets
    Then the result should be false

  Scenario: determineIf sets canAssignTickets to false
    Given a MemberViolationTicketVisa for the ticket and member
    When I call determineIf with a function that returns canAssignTickets
    Then the result should be false

  Scenario: determineIf sets canWorkOnTickets to false
    Given a MemberViolationTicketVisa for the ticket and member
    When I call determineIf with a function that returns canWorkOnTickets
    Then the result should be false

  Scenario: determineIf sets isEditingOwnTicket to true when member is the requestor
    Given a MemberViolationTicketVisa for the ticket and member
    When I call determineIf with a function that returns isEditingOwnTicket
    Then the result should be true

  Scenario: determineIf sets isEditingOwnTicket to false when member is not the requestor
    Given a MemberEntityReference with id "member-2"
    When I create a MemberViolationTicketVisa with the ticket and member
    And I call determineIf with a function that returns isEditingOwnTicket
    Then the result should be false

  Scenario: determineIf sets isEditingAssignedTicket to false when member is not assigned
    Given a MemberViolationTicketVisa for the ticket and member
    When I call determineIf with a function that returns isEditingAssignedTicket
    Then the result should be false

  Scenario: determineIf sets isEditingAssignedTicket to true when member is assigned
    Given a MemberEntityReference with id "member-2"
    When I create a MemberViolationTicketVisa with the ticket and member
    And I call determineIf with a function that returns isEditingAssignedTicket
    Then the result should be true

  Scenario: determineIf sets isSystemAccount to false
    Given a MemberViolationTicketVisa for the ticket and member
    When I call determineIf with a function that returns isSystemAccount
    Then the result should be false