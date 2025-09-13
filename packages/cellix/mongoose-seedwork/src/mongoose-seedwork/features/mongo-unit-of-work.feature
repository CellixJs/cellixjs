Feature: MongoUnitOfWork

  Scenario: Initializing the MongoUnitOfWork
    Given all dependencies are provided
    When MongoUnitOfWork is instantiated
    Then it stores and exposes the dependencies correctly

  Scenario: Domain operation with no events, completes successfully
    Given a domain operation that emits no domain or integration events
    When the operation completes successfully
    Then the transaction is committed and no events are dispatched

  Scenario: Domain operation with no events, throws error
    Given a domain operation that emits no domain or integration events
    When the operation throws an error
    Then the transaction is rolled back and no events are dispatched

  Scenario: Domain operation emits integration events, all dispatch succeed
    Given integration events are emitted during the domain operation
    When the transaction completes successfully
    Then all integration events are dispatched after the transaction commits

  Scenario: Integration event dispatch fails
    Given integration events are emitted during the domain operation
    When integration event dispatch fails
    Then the error from dispatch is propagated and the transaction is not rolled back by the unit of work

  Scenario: Multiple integration events are emitted and all succeed
    Given integration events are emitted during the domain operation
    When multiple integration events are emitted and all succeed
    Then all are dispatched after the transaction
