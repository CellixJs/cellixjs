Feature: ServiceTicketV1ActivityDetail Entity

  Scenario: Creating a new ServiceTicketV1ActivityDetail instance
    When I create a new ServiceTicketV1ActivityDetail with valid properties
    Then the instance should be created successfully
    And the activityType should be "CREATED"
    And the activityDescription should be "Test activity"

  Scenario: Setting activityType
    When I have a ServiceTicketV1ActivityDetail instance
    And I set the activityType to "UPDATED"
    Then the activityType should be updated to "UPDATED"

  Scenario: Setting activityDescription
    When I have a ServiceTicketV1ActivityDetail instance
    And I set the activityDescription to "Updated description"
    Then the activityDescription should be updated to "Updated description"

  Scenario: Loading activityBy
    When I have a ServiceTicketV1ActivityDetail instance
    And I load the activityBy
    Then the activityBy should be returned