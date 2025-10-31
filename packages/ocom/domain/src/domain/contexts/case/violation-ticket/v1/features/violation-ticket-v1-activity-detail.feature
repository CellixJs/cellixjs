Feature: <Entity> ViolationTicketV1ActivityDetail

  Scenario: Creating a new ViolationTicketV1ActivityDetail instance
    When I create a new ViolationTicketV1ActivityDetail with valid properties
    Then the instance should be created successfully
    And the activity type should be set correctly
    And the activity description should be set correctly
    And the activity by reference should be set correctly

  Scenario: Setting activity type with proper permissions
    When I have a ViolationTicketV1ActivityDetail instance
    And I have proper permissions to modify
    And I set the activity type
    Then the activity type should be updated

  Scenario: Setting activity type without permissions
    When I have a ViolationTicketV1ActivityDetail instance
    And I do not have proper permissions to modify
    And I set the activity type
    Then a PermissionError should be thrown

  Scenario: Setting activity description with proper permissions
    When I have a ViolationTicketV1ActivityDetail instance
    And I have proper permissions to modify
    And I set the activity description
    Then the activity description should be updated

  Scenario: Setting activity description without permissions
    When I have a ViolationTicketV1ActivityDetail instance
    And I do not have proper permissions to modify
    And I set the activity description
    Then a PermissionError should be thrown

  Scenario: Loading activity by reference
    When I have a ViolationTicketV1ActivityDetail instance
    And I call loadActivityBy
    Then it should return the member entity reference