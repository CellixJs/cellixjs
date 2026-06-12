Feature: ServiceTokenValidation

  Scenario: Constructing ServiceTokenValidation with valid portal tokens
    Given valid portal tokens mapping for two portals
    When the ServiceTokenValidation is constructed with these tokens
    Then it should pass the configuration map to VerifiedTokenService
    And it should pass the default refresh interval to VerifiedTokenService
    And it should store the VerifiedTokenService instance

  Scenario: Constructing ServiceTokenValidation with missing optional environment variables uses defaults
    Given portal tokens mapping with only required environment variables set
    When the ServiceTokenValidation is constructed with these tokens
    Then the config clockTolerance should default to "5 minutes"
    And the config ignoreIssuer should default to false

  Scenario: Constructing ServiceTokenValidation when ignoreIssuer is explicitly set to true
    Given portal tokens mapping with OIDC_IGNORE_ISSUER set to "true"
    When the ServiceTokenValidation is constructed with these tokens
    Then the config ignoreIssuer should be true

  Scenario: Constructing ServiceTokenValidation with a custom refresh interval
    Given valid portal tokens mapping for one portal
    When the ServiceTokenValidation is constructed with a custom refresh interval of 30000
    Then it should pass the custom refresh interval 30000 to VerifiedTokenService

  Scenario: Constructing ServiceTokenValidation with a missing required environment variable
    Given portal tokens mapping that references a missing environment variable prefix
    When the ServiceTokenValidation is constructed
    Then it should throw an error indicating the environment variable is not set

  Scenario: Starting up the ServiceTokenValidation
    Given a ServiceTokenValidation instance with valid configuration
    When startUp is called
    Then it should call start on the underlying VerifiedTokenService
    And it should resolve with the service instance itself

  Scenario: verifyJwt succeeds on the second provider after a retryable error on the first
    Given a ServiceTokenValidation instance configured with two portals
    And the first portal raises a retryable JWSSignatureVerificationFailed error
    And the second portal resolves with a valid JWT payload
    When verifyJwt is called with a bearer token
    Then it should call getVerifiedJwt for both portal1 and portal2
    And it should return the verifiedJwt and openIdConfigKey from the second portal

  Scenario: verifyJwt propagates a non-retryable error
    Given a ServiceTokenValidation instance configured with one portal
    And the portal raises a non-retryable TypeError
    When verifyJwt is called with a bearer token
    Then it should rethrow the non-retryable error

  Scenario: verifyJwt returns null when a provider returns a result with no payload
    Given a ServiceTokenValidation instance configured with one portal
    And the portal resolves with a result that has no payload
    When verifyJwt is called with a bearer token
    Then it should return null

  Scenario: verifyJwt returns null when all providers return null
    Given a ServiceTokenValidation instance configured with one portal
    And the portal resolves with null
    When verifyJwt is called with a bearer token
    Then it should return null

  Scenario: Shutting down when a timer is running clears the interval and logs
    Given a ServiceTokenValidation instance with a running timer
    When shutDown is called
    Then it should clear the timer interval
    And it should log "ServiceTokenValidation stopped"

  Scenario: Shutting down when no timer is running still logs
    Given a ServiceTokenValidation instance with no timer running
    When shutDown is called
    Then it should log "ServiceTokenValidation stopped"