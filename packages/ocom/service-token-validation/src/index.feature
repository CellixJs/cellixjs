Feature: ServiceTokenValidation

  Scenario: Constructing ServiceTokenValidation with valid portal tokens
    Given valid portal tokens mapping
    When the ServiceTokenValidation is constructed with these tokens
    Then it should create OpenID configurations from environment variables
    And it should initialize the VerifiedTokenService with the configurations

  Scenario: Constructing ServiceTokenValidation with missing optional environment variables
    Given portal tokens mapping with missing optional environment variables
    When the ServiceTokenValidation is constructed with these tokens
    Then it should use default values for missing optional environment variables
    And it should initialize the VerifiedTokenService with default configurations

  Scenario: Constructing ServiceTokenValidation with missing environment variables
    Given portal tokens mapping with missing environment variables
    When the ServiceTokenValidation is constructed
    Then it should throw an error for missing required environment variables

  Scenario: Starting up the ServiceTokenValidation
    Given a ServiceTokenValidation instance with valid configuration
    When startUp is called
    Then it should start the underlying VerifiedTokenService
    And it should return the service instance

  Scenario: Verifying JWT with ServiceTokenValidation
    Given a ServiceTokenValidation instance that is started
    And a valid JWT token
    When verifyJwt is called with the token
    Then it should try verification with each configured provider
    And it should return the verification result when successful

  Scenario: Verifying invalid JWT with ServiceTokenValidation
    Given a ServiceTokenValidation instance that is started
    And an invalid JWT token
    When verifyJwt is called with the invalid token
    Then it should return null indicating verification failed

  Scenario: Shutting down the ServiceTokenValidation
    Given a started ServiceTokenValidation instance
    When shutDown is called
    Then it should stop the underlying VerifiedTokenService
    And it should log that the service stopped