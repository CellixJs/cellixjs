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

  Scenario: Skipping a completed tombstone with no dangling staff users
    Given completed staff role tombstone "role-1" is persisted
    And no staff user references role "role-1"
    When I retry deleted staff role events
    Then no staff role should be saved for event dispatch
    And zero retried roles should be returned

  Scenario: Retrying a completed tombstone with a dangling staff user
    Given completed staff role tombstone "role-1" is persisted
    And a staff user references role "role-1"
    When I retry deleted staff role events
    Then tombstone "role-1" should re-raise its deletion event
    And one retried role should be returned

  Scenario: Retrying one deleted staff role by id
    Given staff role tombstone "role-2" is persisted
    When I retry deleted staff role "role-2"
    Then only tombstone "role-2" should re-raise its deletion event
    And the targeted role should be reported as retried

  Scenario: Surfacing a recovery event processing failure
    Given a deleted staff role event fails during recovery
    When I try to retry deleted staff role events
    Then the recovery processing failure should be rethrown
