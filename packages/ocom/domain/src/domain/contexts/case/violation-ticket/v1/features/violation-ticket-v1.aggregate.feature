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

  Scenario: Setting communityId on new instance
    When I create a new ViolationTicketV1 instance
    And I set the communityId
    Then a PermissionError should be thrown

  Scenario: Setting communityId on existing instance
    When I have a ViolationTicketV1 instance
    And I set the communityId
    Then a PermissionError should be thrown

  Scenario: Setting propertyId with proper permissions
    When I have a ViolationTicketV1 instance
    And I have proper permissions to set propertyId
    And I set the propertyId
    Then the propertyId should be updated

  Scenario: Setting propertyId without permissions
    When I have a ViolationTicketV1 instance
    And I do not have proper permissions to set propertyId
    And I set the propertyId
    Then a PermissionError should be thrown

  Scenario: Setting assignedToId with proper permissions
    When I have a ViolationTicketV1 instance
    And I have proper permissions to assign
    And I set the assignedToId
    Then the assignedToId should be updated

  Scenario: Setting assignedToId without permissions
    When I have a ViolationTicketV1 instance
    And I do not have proper permissions to assign
    And I set the assignedToId
    Then a PermissionError should be thrown

  Scenario: Setting serviceId with proper permissions
    When I have a ViolationTicketV1 instance
    And I have proper permissions to set serviceId
    And I set the serviceId
    Then the serviceId should be updated

  Scenario: Setting serviceId without permissions
    When I have a ViolationTicketV1 instance
    And I do not have proper permissions to set serviceId
    And I set the serviceId
    Then a PermissionError should be thrown

  Scenario: Setting description with proper permissions
    When I have a ViolationTicketV1 instance
    And I have proper permissions to set description
    And I set the description
    Then the description should be updated

  Scenario: Setting description without permissions
    When I have a ViolationTicketV1 instance
    And I do not have proper permissions to set description
    And I set the description
    Then a PermissionError should be thrown

  Scenario: Setting ticketType with proper permissions
    When I have a ViolationTicketV1 instance
    And I have proper permissions to set ticketType
    And I set the ticketType
    Then the ticketType should be updated

  Scenario: Setting ticketType without permissions
    When I have a ViolationTicketV1 instance
    And I do not have proper permissions to set ticketType
    And I set the ticketType
    Then a PermissionError should be thrown

  Scenario: Setting status with system account permissions
    When I have a ViolationTicketV1 instance
    And I have system account permissions
    And I set the status
    Then the status should be updated

  Scenario: Setting status without permissions
    When I have a ViolationTicketV1 instance
    And I do not have system account permissions
    And I set the status
    Then a PermissionError should be thrown

  Scenario: Setting priority with proper permissions
    When I have a ViolationTicketV1 instance
    And I have proper permissions to set priority
    And I set the priority
    Then the priority should be updated

  Scenario: Setting priority without permissions
    When I have a ViolationTicketV1 instance
    And I do not have proper permissions to set priority
    And I set the priority
    Then a PermissionError should be thrown

  Scenario: Setting hash with proper permissions
    When I have a ViolationTicketV1 instance
    And I have proper permissions to set hash
    And I set the hash
    Then the hash should be updated

  Scenario: Setting hash without permissions
    When I have a ViolationTicketV1 instance
    And I do not have proper permissions to set hash
    And I set the hash
    Then a PermissionError should be thrown

  Scenario: Setting lastIndexed with proper permissions
    When I have a ViolationTicketV1 instance
    And I have proper permissions to set lastIndexed
    And I set the lastIndexed
    Then the lastIndexed should be updated

  Scenario: Setting lastIndexed without permissions
    When I have a ViolationTicketV1 instance
    And I do not have proper permissions to set lastIndexed
    And I set the lastIndexed
    Then a PermissionError should be thrown

  Scenario: Setting updateIndexFailedDate with proper permissions
    When I have a ViolationTicketV1 instance
    And I have proper permissions to set updateIndexFailedDate
    And I set the updateIndexFailedDate
    Then the updateIndexFailedDate should be updated

  Scenario: Setting updateIndexFailedDate without permissions
    When I have a ViolationTicketV1 instance
    And I do not have proper permissions to set updateIndexFailedDate
    And I set the updateIndexFailedDate
    Then a PermissionError should be thrown

  Scenario: Adding message with proper permissions
    When I have a ViolationTicketV1 instance
    And I have proper permissions to add messages
    And I add a message
    Then a new message should be created

  Scenario: Adding message without permissions
    When I have a ViolationTicketV1 instance
    And I do not have proper permissions to add messages
    And I add a message
    Then a PermissionError should be thrown

  Scenario: Adding photo with proper permissions
    When I have a ViolationTicketV1 instance
    And I have proper permissions to add photos
    And I add a photo
    Then a new photo should be created

  Scenario: Adding photo without permissions
    When I have a ViolationTicketV1 instance
    And I do not have proper permissions to add photos
    And I add a photo
    Then a PermissionError should be thrown

  Scenario: Adding valid status transition with proper permissions
    When I have a ViolationTicketV1 instance with status "Draft"
    And I have proper permissions to change status
    And I add a status transition to "Submitted"
    Then the status should be updated
    And a new activity detail should be created

  Scenario: Adding invalid status transition
    When I have a ViolationTicketV1 instance with status "Draft"
    And I have proper permissions to change status
    And I add a status transition to "Closed"
    Then a PermissionError should be thrown

  Scenario: Adding status transition without permissions
    When I have a ViolationTicketV1 instance with status "Draft"
    And I do not have proper permissions to change status
    And I add a status transition to "Submitted"
    Then a PermissionError should be thrown

  Scenario: Requesting new activity detail
    When I have a ViolationTicketV1 instance
    And I request a new activity detail
    Then a new activity detail should be returned

  Scenario: Getting activity log
    When I have a ViolationTicketV1 instance
    Then I should be able to get the activity log

  Scenario: Getting messages
    When I have a ViolationTicketV1 instance
    Then I should be able to get the messages

  Scenario: Getting photos
    When I have a ViolationTicketV1 instance
    Then I should be able to get the photos

  Scenario: Getting finance details
    When I have a ViolationTicketV1 instance
    Then I should be able to get the finance details

  Scenario: Getting revision request
    When I have a ViolationTicketV1 instance
    Then I should be able to get the revision request

  Scenario: Getting createdAt
    When I have a ViolationTicketV1 instance
    Then I should be able to get the createdAt date

  Scenario: Getting updatedAt
    When I have a ViolationTicketV1 instance
    Then I should be able to get the updatedAt date

  Scenario: Getting schemaVersion
    When I have a ViolationTicketV1 instance
    Then I should be able to get the schemaVersion

  Scenario: Calling onSave with modifications
    When I have a ViolationTicketV1 instance
    And I call onSave with isModified true
    Then an updated event should be added

  Scenario: Calling onSave without modifications
    When I have a ViolationTicketV1 instance
    And I call onSave with isModified false
    Then no updated event should be added