Feature: Auto Provisioning
  As a developer running NODE_ENV=development
  I want queues to be auto-provisioned in local environments

  Scenario: Development environment triggers provisioning
    Given the environment is development
    When the service starts up with provisioning enabled
    Then the queues listed in the config are provisioned
