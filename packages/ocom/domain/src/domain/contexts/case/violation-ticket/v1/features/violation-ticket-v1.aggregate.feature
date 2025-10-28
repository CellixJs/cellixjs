Feature: <Aggregate> ViolationTicketV1

  Scenario: Creating a new ViolationTicketV1 instance
    When I create a new ViolationTicketV1 with valid properties
    Then the instance should be created successfully
    And the status should be "Draft"
    And the priority should be 5
    And a created event should be added

  Scenario: Requesting delete with proper permissions
    When I have a ViolationTicketV1 instance
    And I have system account permissions
    And I request delete
    Then the ticket should be marked as deleted
    And a deleted event should be added

  Scenario: Requesting delete without permissions
    When I have a ViolationTicketV1 instance
    And I do not have proper permissions
    And I request delete
    Then a PermissionError should be thrown

  Scenario: Adding status update with proper permissions
    When I have a ViolationTicketV1 instance
    And I have proper permissions to update
    And I add a status update
    Then a new activity detail should be created
    And the activity type should be "Updated"

  Scenario: Adding status update without permissions
    When I have a ViolationTicketV1 instance
    And I do not have proper permissions to update
    And I add a status update
    Then a PermissionError should be thrown

  Scenario: Setting title with proper permissions
    When I have a ViolationTicketV1 instance
    And I have proper permissions to set title
    And I set the title
    Then the title should be updated

  Scenario: Setting title without permissions
    When I have a ViolationTicketV1 instance
    And I do not have proper permissions to set title
    And I set the title
    Then a PermissionError should be thrown