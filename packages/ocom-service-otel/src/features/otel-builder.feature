Feature: OtelBuilder

  Scenario: Building exporters for console output
    Given an environment where exportToConsole is true
    When buildExporters is called with exportToConsole true
    Then it should return ConsoleSpanExporter, ConsoleMetricExporter, and ConsoleLogRecordExporter

  Scenario: Building exporters for Azure Monitor
    Given the APPLICATIONINSIGHTS_CONNECTION_STRING environment variable is set
    When buildExporters is called with exportToConsole false
    Then it should return AzureMonitorTraceExporter, AzureMonitorMetricExporter, and AzureMonitorLogExporter with the correct connection string

  Scenario: Failing to build exporters without connection string
    Given the APPLICATIONINSIGHTS_CONNECTION_STRING environment variable is not set
    When buildExporters is called with exportToConsole false
    Then it should throw an error about the missing environment variable

  Scenario: Building simple processors
    Given exporters are provided
    When buildProcessors is called with useSimpleProcessors true
    Then it should return SimpleSpanProcessor and SimpleLogRecordProcessor using the provided exporters

  Scenario: Building batch processors
    Given exporters are provided
    When buildProcessors is called with useSimpleProcessors false
    Then it should return BatchSpanProcessor and BatchLogRecordProcessor using the provided exporters and correct options

  Scenario: Building a metric reader
    Given exporters are provided
    When buildMetricReader is called
    Then it should return a PeriodicExportingMetricReader with the correct exporter and interval

  Scenario: Building instrumentations
    Given exporters are provided
    When buildInstrumentations is called
    Then it should return an array including HttpInstrumentation, AzureFunctionsInstrumentation, GraphQLInstrumentation, DataloaderInstrumentation, and MongooseInstrumentation
