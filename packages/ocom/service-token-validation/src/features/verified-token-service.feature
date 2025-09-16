Feature: VerifiedTokenService

  Scenario: Constructing VerifiedTokenService with valid OpenID configurations
    Given valid OpenID configurations for multiple providers
    When the VerifiedTokenService is constructed with these configurations
    Then it should initialize the keystore collection and store the configurations

  Scenario: Constructing VerifiedTokenService with empty configurations
    Given no OpenID configurations
    When the VerifiedTokenService is constructed with empty configurations
    Then it should throw an error indicating configurations are required

  Scenario: Starting the VerifiedTokenService
    Given a VerifiedTokenService instance with valid configurations
    When the service is started
    Then it should begin periodic keystore refresh and immediately refresh the collection

  Scenario: Starting service that is already started
    Given a VerifiedTokenService instance that is already started
    When start is called again
    Then it should not create a new timer and should return early

  Scenario: Refreshing keystore collection
    Given a VerifiedTokenService instance with valid configurations
    When the keystore collection is refreshed
    Then it should create remote JWK sets and update the keystore collection

  Scenario: Refreshing keystore collection with null configs
    Given a VerifiedTokenService instance
    When the keystore collection is refreshed with null configs
    Then it should return early without processing

  Scenario: Verifying a valid JWT token
    Given a VerifiedTokenService instance that is started
    And a valid JWT token for a configured provider
    When the JWT is verified with the correct config key
    Then it should return the verified JWT payload with expected claims

  Scenario: Verifying JWT with invalid config key
    Given a VerifiedTokenService instance that is started
    And a valid JWT token
    When the JWT is verified with an invalid config key
    Then it should throw an error indicating invalid config key

  Scenario: Verifying JWT when service is not started
    Given a VerifiedTokenService instance that is not started
    And a valid JWT token
    When the JWT is verified
    Then it should throw an error indicating the service is not started

  Scenario: Verifying JWT with issuer validation disabled
    Given a VerifiedTokenService instance that is started
    And a JWT token with mismatched issuer
    And issuer validation is disabled for the config
    When the JWT is verified with the config key
    Then it should successfully verify the token despite issuer mismatch

  Scenario: Verifying JWT with issuer validation enabled
    Given a VerifiedTokenService instance that is started
    And a valid JWT token
    And issuer validation is enabled for the config
    When the JWT is verified with the config key
    Then it should verify the token with issuer validation