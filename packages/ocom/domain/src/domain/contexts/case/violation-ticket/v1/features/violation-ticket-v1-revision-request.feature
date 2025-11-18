Feature: <Entity> ViolationTicketV1RevisionRequest

  Scenario: Creating a new ViolationTicketV1RevisionRequest instance
    When I create a new ViolationTicketV1RevisionRequest with valid properties
    Then the instance should be created successfully
    And the requested at should be set correctly
    And the requested by should be set correctly
    And the revision summary should be set correctly
    And the requested changes should be set correctly
    And the revision submitted at should be undefined

  Scenario: Creating a new ViolationTicketV1RevisionRequest using getNewInstance
    When I create a new ViolationTicketV1RevisionRequest using getNewInstance
    Then the instance should be created successfully
    And the requested at should be set to current date
    And the requested by should be set correctly
    And the revision summary should be set correctly
    And the requested changes should be set correctly

  Scenario: Setting revision submitted at with proper permissions
    When I have a ViolationTicketV1RevisionRequest instance
    And I have proper permissions to modify
    And I set the revision submitted at
    Then the revision submitted at should be updated

  Scenario: Setting revision submitted at to undefined
    When I have a ViolationTicketV1RevisionRequest instance
    And I have proper permissions to modify
    And I set the revision submitted at to undefined
    Then the revision submitted at should be undefined

  Scenario: Setting revision submitted at to a past date
    When I have a ViolationTicketV1RevisionRequest instance
    And I have proper permissions to modify
    And I set the revision submitted at to a past date
    Then the revision submitted at should be updated to the past date

  Scenario: Setting revision submitted at without permissions
    When I have a ViolationTicketV1RevisionRequest instance
    And I do not have proper permissions to modify
    And I set the revision submitted at
    Then a PermissionError should be thrown

  Scenario: Setting revision submitted at with canManageTickets permission
    When I have a ViolationTicketV1RevisionRequest instance
    And I have canManageTickets permission
    And I set the revision submitted at
    Then the revision submitted at should be updated

  Scenario: Setting revision submitted at with isSystemAccount permission
    When I have a ViolationTicketV1RevisionRequest instance
    And I have isSystemAccount permission
    And I set the revision submitted at
    Then the revision submitted at should be updated

  Scenario: Loading requested by reference
    When I have a ViolationTicketV1RevisionRequest instance
    And I call loadRequestedBy
    Then it should return the member entity reference

  Scenario: Loading requested by when the load function throws an error
    When I have a ViolationTicketV1RevisionRequest instance
    And the loadRequestedBy function throws an error
    And I call loadRequestedBy
    Then it should throw the error

  Scenario: Creating with all requested changes false
    When I create a new ViolationTicketV1RevisionRequest with all requested changes false
    Then the instance should be created successfully
    And the requested changes should have all false

  Scenario: Creating with all requested changes true
    When I create a new ViolationTicketV1RevisionRequest with all requested changes true
    Then the instance should be created successfully
    And the requested changes should have all true