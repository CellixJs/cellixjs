Feature: Logging field resolution for queue definitions
  As a consumer of @cellix/service-queue-storage
  I want to declare loggingTags and loggingMetadata on a queue definition
  So that blob files are tagged with values derived from the message payload

  Scenario: Hardcoded string value is used as-is
    Given a loggingTags spec with a hardcoded value "community" for key "domain"
    When the spec is resolved against any payload
    Then the resolved tags contain domain="community"

  Scenario: Payload field reference extracts a field from the message payload
    Given a loggingTags spec with a payloadField reference "externalId" for key "externalId"
    When the spec is resolved against a payload with externalId="ext-abc"
    Then the resolved tags contain externalId="ext-abc"

  Scenario: $payload proxy extracts a field from the message payload
    Given a loggingTags spec using $payload.externalId for key "externalId"
    When the spec is resolved against a payload with externalId="ext-xyz"
    Then the resolved tags contain externalId="ext-xyz"

  Scenario: Missing payload field is omitted from the result
    Given a loggingTags spec with a payloadField reference "externalId" for key "externalId"
    When the spec is resolved against a payload without that field
    Then the resolved tags do not contain the key "externalId"

  Scenario: Consumer logs received messages with resolved metadata and tags
    Given a queue registry with an "importRequests" inbound queue with loggingTags for "externalId"
    And a logger is configured on the service
    When a message with externalId="ext-xyz" is received from the queue
    Then the logger is called with tags containing externalId="ext-xyz"

  Scenario: Producer sends messages with resolved metadata and tags using $payload
    Given a queue registry with an outbound queue using $payload.externalId in loggingTags
    And a logger is configured on the service
    When a message with externalId="ext-abc" is sent to the queue
    Then the logger is called with tags containing externalId="ext-abc"
