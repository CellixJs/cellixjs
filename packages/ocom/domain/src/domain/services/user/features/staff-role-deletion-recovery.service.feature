Feature: <Service> StaffRoleDeletionRecoveryService

  Scenario: Retrying persisted deleted staff roles
    Given two staff role tombstones are persisted
    When I retry deleted staff role events
    Then each tombstone should re-raise its deletion event under a system passport
    And the number of retried roles should be returned

  Scenario: No deleted staff roles require recovery
    Given no staff role tombstones are persisted
    When I retry deleted staff role events
    Then no staff role should be saved for event dispatch
    And zero retried roles should be returned

  Scenario: Surfacing a recovery event processing failure
    Given a deleted staff role event fails during recovery
    When I try to retry deleted staff role events
    Then the recovery processing failure should be rethrown
