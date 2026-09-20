Feature: CommunityConfig

  CommunityConfig holds effective-dated pricing and limits for a subscription tier.
  It is global, system-managed configuration, so only a system account may change it.

  Scenario: Creating configuration for a subscription tier
    Given a system account passport
    When a new CommunityConfig is created for the "enterprise" tier at 2000 cents per member with limits of 200 members and 10 admins
    Then the subscription tier should be "enterprise"
    And the price per member should be 2000
    And the member limit should be 200

  Scenario: Changing configuration without a system account
    Given a passport that is not a system account
    When the subscription tier is changed to "enterprise"
    Then a PermissionError should be thrown
