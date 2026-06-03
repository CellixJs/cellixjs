Feature: Query staff user by external ID

  Scenario: Returns a staff user when the external ID exists
    Given a staff user with externalId "ext-123" exists in the read repository
    When I call queryByExternalId with externalId "ext-123"
    Then it should return the matching staff user

  Scenario: Returns null when no staff user matches the external ID
    Given no staff user with externalId "ext-missing" exists in the read repository
    When I call queryByExternalId with externalId "ext-missing"
    Then it should return null
