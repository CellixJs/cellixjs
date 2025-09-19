Feature: modelFactory

  Scenario: Returning an existing model
    Given an initialized service with a registered model
    When modelFactory is called with the model name and schema
    Then it should return the existing model from the service

  Scenario: Registering and returning a new model
    Given an initialized service without the model registered
    When modelFactory is called with the model name and schema
    Then it should register the model on the service and return it