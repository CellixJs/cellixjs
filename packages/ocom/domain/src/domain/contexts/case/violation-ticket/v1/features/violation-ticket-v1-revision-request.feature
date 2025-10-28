Feature: <Entity> ViolationTicketV1RevisionRequest

  Scenario: Creating a new ViolationTicketV1RevisionRequest instance
    When I create a new ViolationTicketV1RevisionRequest with valid properties
    Then the instance should be created successfully
    And the requested at should be set correctly
    And the requested by should be set correctly
    And the revision summary should be set correctly
    And the requested changes should be set correctly
    And the revision submitted at should be undefined

  Scenario: Setting revision submitted at with proper permissions
    When I have a ViolationTicketV1RevisionRequest instance
    And I have proper permissions to modify
    And I set the revision submitted at
    Then the revision submitted at should be updated

  Scenario: Setting revision submitted at without permissions
    When I have a ViolationTicketV1RevisionRequest instance
    And I do not have proper permissions to modify
    And I set the revision submitted at
    Then a PermissionError should be thrown

  Scenario: Loading requested by reference
    When I have a ViolationTicketV1RevisionRequest instance
    And I call loadRequestedBy
    Then it should return the member entity reference