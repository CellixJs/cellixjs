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

  Scenario: getInitializedUnitOfWork creates initialized unit of work
    Given a MongoUnitOfWork instance
    When getInitializedUnitOfWork is called with passport
    Then it returns an InitializedUnitOfWork with required methods

  Scenario: InitializedUnitOfWork withTransaction method
    Given an initialized unit of work
    When withTransaction is called
    Then it delegates to the underlying unit of work

  Scenario: InitializedUnitOfWork withScopedTransaction method
    Given an initialized unit of work
    When withScopedTransaction is called
    Then it delegates to the underlying unit of work with the stored passport

  Scenario: InitializedUnitOfWork withScopedTransactionById with existing item
    Given an initialized unit of work and an existing item
    When withScopedTransactionById is called with valid id
    Then it gets the item, executes the callback, saves and returns the item

  Scenario: InitializedUnitOfWork withScopedTransactionById with non-existing item
    Given an initialized unit of work
    When withScopedTransactionById is called with invalid id
    Then it throws an error indicating item not found

  Scenario: InitializedUnitOfWork withScopedTransactionById callback throws error
    Given an initialized unit of work and an existing item
    When withScopedTransactionById callback throws an error
    Then the error is propagated and transaction is rolled back
