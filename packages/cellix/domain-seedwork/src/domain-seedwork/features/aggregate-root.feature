Feature: AggregateRoot

  Background:
    Given an aggregate root instance

  Scenario: Constructing an Aggregate Root
    Given a set of initial properties and some type of passport
    When the aggregate root is constructed
    Then it should initialize the properties correctly

  Scenario: Managing Domain Events - add one
    When a domain event is added
    Then it should add a domain event to the aggregate domain events and not have any integration events

  Scenario: Managing Domain Events - add multiple
    When multiple domain events are added
    Then it should have multiple domain events on the aggregate and not have any integration events
    And it should maintain order of domain events

  Scenario: Managing Domain Events - clear after add
    When domain events are added and then cleared
    Then it should clear all domain events from the aggregate

  Scenario: Managing Domain Events - clear with none
    When no domain events are added but domain events are cleared
    Then it should not emit any domain events

  Scenario: Managing Domain Events - clear domain only
    When domain events and integration events exist and domain events are cleared
    Then it should clear all domain events from the aggregate but not integration events

  Scenario: Managing Domain Events - clear all
    When domain events and integration events exist and both domain events and integration events are cleared
    Then it should clear all domain events and all integration events from the aggregate

  Scenario: Managing Integration Events - add one
    When an integration event is added
    Then it should add an integration event to the aggregate integration events and not have any domain events

  Scenario: Managing Integration Events - add multiple
    When multiple integration events are added
    Then it should have multiple integration events on the aggregate and not have any domain events
    And it should maintain order of integration events

  Scenario: Managing Integration Events - clear
    When integration events are cleared
    Then it should clear all integration events from the aggregate

  Scenario: Managing Integration Events - clear integration only
    When integration events and domain events exist and integration events are cleared
    Then it should clear all integration events from the aggregate but not domain events

  Scenario: Saving an Aggregate Root (modified)
    When the onSave method is called with true
    Then it should not throw an error
    And it should emit the onSave event

  Scenario: Saving an Aggregate Root (not modified)
    When the onSave method is called with false
    Then it should not throw an error
    And it should not emit the onSave event

  Scenario: Deleting an Aggregate Root (not deleted)
    When the aggregate root has not requested deletion
    Then the isDeleted property should be false

  Scenario: Deleting an Aggregate Root (deleted)
    When the aggregate root requests to be deleted
    Then the isDeleted property should be set to true
