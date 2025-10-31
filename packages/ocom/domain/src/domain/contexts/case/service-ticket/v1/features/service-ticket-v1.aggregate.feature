Feature: <Aggregate> ServiceTicketV1

  Scenario: Creating a new ServiceTicketV1 instance
    When I create a new ServiceTicketV1 with valid properties
    Then the instance should be created successfully
    And the status should be "Draft"
    And the priority should be 3
    And a created event should be added

  Scenario: Requesting delete with proper permissions
    When I have a ServiceTicketV1 instance
    And I have system account permissions
    And I request delete
    Then the ticket should be marked as deleted
    And a deleted event should be added

  Scenario: Requesting delete without permissions
    When I have a ServiceTicketV1 instance
    And I do not have proper permissions
    And I request delete
    Then a PermissionError should be thrown

  Scenario: Adding status update with proper permissions
    When I have a ServiceTicketV1 instance
    And I have proper permissions to update
    And I add a status update
    Then a new activity detail should be created
    And the activity type should be "Updated"

  Scenario: Adding status update without permissions
    When I have a ServiceTicketV1 instance
    And I do not have proper permissions to update
    And I add a status update
    Then a PermissionError should be thrown

  Scenario: Setting title with proper permissions
    When I have a ServiceTicketV1 instance
    And I have proper permissions to set title
    And I set the title
    Then the title should be updated

  Scenario: Setting title without permissions
    When I have a ServiceTicketV1 instance
    And I do not have proper permissions to set title
    And I set the title
    Then a PermissionError should be thrown

  Scenario: Setting description with proper permissions
    When I have a ServiceTicketV1 instance
    And I have proper permissions to set description
    And I set the description
    Then the description should be updated

  Scenario: Setting description without permissions
    When I have a ServiceTicketV1 instance
    And I do not have proper permissions to set description
    And I set the description
    Then a PermissionError should be thrown

  Scenario: Setting status with proper permissions
    When I have a ServiceTicketV1 instance
    And I have proper permissions to set status
    And I set the status
    Then the status should be updated

  Scenario: Setting status without permissions
    When I have a ServiceTicketV1 instance
    And I do not have proper permissions to set status
    And I set the status
    Then a PermissionError should be thrown

  Scenario: Setting priority with proper permissions
    When I have a ServiceTicketV1 instance
    And I have proper permissions to set priority
    And I set the priority
    Then the priority should be updated

  Scenario: Setting priority without permissions
    When I have a ServiceTicketV1 instance
    And I do not have proper permissions to set priority
    And I set the priority
    Then a PermissionError should be thrown

  Scenario: Requesting valid status transition
    When I have a ServiceTicketV1 instance
    And I have proper permissions for status transition
    And I request a valid status transition
    Then the status should be updated
    And an activity detail should be created with correct type

  Scenario: Requesting invalid status transition
    When I have a ServiceTicketV1 instance
    And I have proper permissions for status transition
    And I request an invalid status transition
    Then a PermissionError should be thrown

  Scenario: Setting communityId with proper permissions
    When I have a ServiceTicketV1 instance
    And I have proper permissions to set communityId
    And I set the communityId
    Then the communityId should be updated

  Scenario: Setting communityId without permissions
    When I have a ServiceTicketV1 instance
    And I do not have proper permissions to set communityId
    And I set the communityId
    Then a PermissionError should be thrown

  Scenario: Setting propertyId with proper permissions
    When I have a ServiceTicketV1 instance
    And I have proper permissions to set propertyId
    And I set the propertyId
    Then the propertyId should be updated

  Scenario: Setting propertyId without permissions
    When I have a ServiceTicketV1 instance
    And I do not have proper permissions to set propertyId
    And I set the propertyId
    Then a PermissionError should be thrown

  Scenario: Setting requestorId with proper permissions
    When I have a ServiceTicketV1 instance
    And I have proper permissions to set requestorId
    And I set the requestorId
    Then the requestorId should be updated

  Scenario: Setting requestorId without permissions
    When I have a ServiceTicketV1 instance
    And I do not have proper permissions to set requestorId
    And I set the requestorId
    Then a PermissionError should be thrown

  Scenario: Setting assignedToId with proper permissions
    When I have a ServiceTicketV1 instance
    And I have proper permissions to assign
    And I set the assignedToId
    Then the assignedToId should be updated

  Scenario: Setting assignedToId without permissions
    When I have a ServiceTicketV1 instance
    And I do not have proper permissions to assign
    And I set the assignedToId
    Then a PermissionError should be thrown

  Scenario: Setting serviceId with proper permissions
    When I have a ServiceTicketV1 instance
    And I have proper permissions to set serviceId
    And I set the serviceId
    Then the serviceId should be updated

  Scenario: Setting serviceId without permissions
    When I have a ServiceTicketV1 instance
    And I do not have proper permissions to set serviceId
    And I set the serviceId
    Then a PermissionError should be thrown

  Scenario: Setting hash
    When I have a ServiceTicketV1 instance
    And I set the hash
    Then the hash should be updated

  Scenario: Setting lastIndexed
    When I have a ServiceTicketV1 instance
    And I set the lastIndexed
    Then the lastIndexed should be updated

  Scenario: Setting updateIndexFailedDate
    When I have a ServiceTicketV1 instance
    And I set the updateIndexFailedDate
    Then the updateIndexFailedDate should be updated

  Scenario: Requesting new activity detail
    When I have a ServiceTicketV1 instance
    And I request a new activity detail
    Then a new activity detail should be returned

  Scenario: Getting activity log
    When I have a ServiceTicketV1 instance
    Then I should be able to get the activity log

  Scenario: Getting messages
    When I have a ServiceTicketV1 instance
    Then I should be able to get the messages

  Scenario: Getting createdAt
    When I have a ServiceTicketV1 instance
    Then I should be able to get the createdAt date

  Scenario: Getting updatedAt
    When I have a ServiceTicketV1 instance
    Then I should be able to get the updatedAt date

  Scenario: Getting schemaVersion
    When I have a ServiceTicketV1 instance
    Then I should be able to get the schemaVersion

  Scenario: Calling onSave with modifications
    When I have a ServiceTicketV1 instance
    And I call onSave with isModified true
    Then an updated event should be added

  Scenario: Calling onSave without modifications
    When I have a ServiceTicketV1 instance
    And I call onSave with isModified false
    Then no updated event should be added