Feature: <Export> Community Services Index

  Scenario: Exporting CommunityProvisioningService
    Given the community services index module
    When I import the Community object
    Then it should contain a CommunityProvisioningService instance
    And the CommunityProvisioningService should have a provisionMemberAndDefaultRole method