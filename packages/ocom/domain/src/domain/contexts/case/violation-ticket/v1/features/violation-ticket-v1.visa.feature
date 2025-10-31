Feature: Violation Ticket V1 Visa Authorization
  As a domain developer
  I want to ensure violation ticket visas properly authorize operations
  So that users can only perform allowed actions on violation tickets

  Background:
    Given a violation ticket visa is available

  Scenario: Staff user can create tickets
    Given a staff user violation ticket visa
    When checking if user can create tickets
    Then the visa should allow the operation

  Scenario: Staff user can manage tickets
    Given a staff user violation ticket visa
    When checking if user can manage tickets
    Then the visa should allow the operation

  Scenario: Staff user can assign tickets
    Given a staff user violation ticket visa
    When checking if user can assign tickets
    Then the visa should allow the operation

  Scenario: Staff user can work on tickets
    Given a staff user violation ticket visa
    When checking if user can work on tickets
    Then the visa should allow the operation

  Scenario: Staff user is not editing own ticket
    Given a staff user violation ticket visa
    When checking if user is editing own ticket
    Then the visa should deny the operation

  Scenario: Staff user is not editing assigned ticket
    Given a staff user violation ticket visa
    When checking if user is editing assigned ticket
    Then the visa should deny the operation

  Scenario: Staff user is not system account
    Given a staff user violation ticket visa
    When checking if user is system account
    Then the visa should deny the operation

  Scenario: Member can create tickets in their community
    Given a member violation ticket visa for their community
    When checking if user can create tickets
    Then the visa should allow the operation

  Scenario: Member cannot manage tickets
    Given a member violation ticket visa for their community
    When checking if user can manage tickets
    Then the visa should deny the operation

  Scenario: Member cannot assign tickets
    Given a member violation ticket visa for their community
    When checking if user can assign tickets
    Then the visa should deny the operation

  Scenario: Member cannot work on tickets
    Given a member violation ticket visa for their community
    When checking if user can work on tickets
    Then the visa should deny the operation

  Scenario: Member is editing own ticket
    Given a member violation ticket visa where member is the requestor
    When checking if user is editing own ticket
    Then the visa should allow the operation

  Scenario: Member is not editing own ticket when different requestor
    Given a member violation ticket visa where member is not the requestor
    When checking if user is editing own ticket
    Then the visa should deny the operation

  Scenario: Member is editing assigned ticket
    Given a member violation ticket visa where member is assigned
    When checking if user is editing assigned ticket
    Then the visa should allow the operation

  Scenario: Member is not editing assigned ticket when not assigned
    Given a member violation ticket visa where member is not assigned
    When checking if user is editing assigned ticket
    Then the visa should deny the operation

  Scenario: Member is not system account
    Given a member violation ticket visa for their community
    When checking if user is system account
    Then the visa should deny the operation

  Scenario: Member cannot access ticket from different community
    Given a member violation ticket visa for different community
    When checking any permission
    Then the visa should deny the operation