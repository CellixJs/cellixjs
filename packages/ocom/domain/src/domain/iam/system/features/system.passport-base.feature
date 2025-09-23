Feature: <Passport> SystemPassportBase

  Scenario: Creating SystemPassportBase with no permissions
    Given I have no permissions
    When I create a SystemPassportBase with no permissions
    And I access the protected permissions property
    Then it should return an empty permissions object

  Scenario: Creating SystemPassportBase with provided permissions
    Given I have permissions object with canManageMembers true and canManageCommunities false
    When I create a SystemPassportBase with these permissions
    And I access the protected permissions property
    Then it should return the same permissions object

  Scenario: Creating SystemPassportBase with partial permissions
    Given I have a partial permissions object with only canManageMembers true
    When I create a SystemPassportBase with these permissions
    And I access the protected permissions property
    Then it should return the partial permissions object

  Scenario: Creating SystemPassportBase with undefined permissions
    Given I pass undefined as permissions
    When I create a SystemPassportBase with undefined permissions
    And I access the protected permissions property
    Then it should return an empty permissions object