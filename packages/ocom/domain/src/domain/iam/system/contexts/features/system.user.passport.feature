Feature: <Class> SystemUserPassport

  Background:
    Given I have user domain permissions with canManageEndUsers true

  Scenario: Creating SystemUserPassport and getting visa for end user
    Given I create a SystemUserPassport with permissions
    And I have an end user entity reference
    When I call forEndUser with the end user reference
    Then it should return a UserVisa
    And the visa should allow determining permissions

  Scenario: Creating SystemUserPassport and getting visa for staff user
    Given I create a SystemUserPassport with permissions
    And I have a staff user entity reference
    When I call forStaffUser with the staff user reference
    Then it should return a UserVisa
    And the visa should allow determining permissions

  Scenario: Creating SystemUserPassport and getting visa for staff role
    Given I create a SystemUserPassport with permissions
    And I have a staff role entity reference
    When I call forStaffRole with the staff role reference
    Then it should return a UserVisa
    And the visa should allow determining permissions

  Scenario: Creating SystemUserPassport and getting visa for vendor user
    Given I create a SystemUserPassport with permissions
    And I have a vendor user entity reference
    When I call forVendorUser with the vendor user reference
    Then it should return a UserVisa
    And the visa should allow determining permissions

  Scenario: Creating SystemUserPassport with no permissions
    Given I create a SystemUserPassport with no permissions
    And I have an end user entity reference
    When I call forEndUser with the end user reference
    Then it should return a UserVisa that works with empty permissions

  Scenario: Using visa to determine permissions
    Given I create a SystemUserPassport with canManageEndUsers permission
    And I have an end user entity reference
    When I get a visa for the end user
    And I use determineIf to check if canManageEndUsers is true
    Then it should return true