Feature: ServiceOtel

  Scenario: Constructing ServiceOtel with default configuration
    Given no specific options for the Open Telemetry service
    When the OpenTelemetry service is constructed with no options
    Then it should initialize the OpenTelemetry NodeSDK with default resource and instrumentations

  Scenario: Constructing ServiceOtel with exportToConsole enabled
    When the OpenTelemetry service is constructed with exportToConsole set to true
    Then it should configure exporters to output telemetry to the console

  Scenario: Constructing ServiceOtel with useSimpleProcessors enabled
    When the OpenTelemetry service is constructed with useSimpleProcessors set to true
    Then it should configure the SDK to use simple processors for telemetry

  Scenario: Starting up the service
    Given an OpenTelemetry service instance
    When startUp is called
    Then it should start the OpenTelemetry NodeSDK

  Scenario: Shutting down the service
    Given a started OpenTelemetry service instance
    When shutDown is called
    Then it should shut down the OpenTelemetry NodeSDK and log that the service stopped
