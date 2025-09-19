Feature: <Passport> GuestUserPassport

  Scenario: Creating GuestUserPassport and getting visa for end user
    When I create a GuestUserPassport
    And I have an end user entity reference
    And I call forEndUser with the user reference
    Then it should return a UserVisa
    And the visa should deny all permissions

  Scenario: Creating GuestUserPassport and getting visa for staff user
    When I create a GuestUserPassport
    And I have a staff user entity reference
    And I call forStaffUser with the user reference
    Then it should return a UserVisa
    And the visa should deny all permissions

  Scenario: Creating GuestUserPassport and getting visa for staff role
    When I create a GuestUserPassport
    And I have a staff role entity reference
    And I call forStaffRole with the role reference
    Then it should return a UserVisa
    And the visa should deny all permissions

  Scenario: Creating GuestUserPassport and getting visa for vendor user
    When I create a GuestUserPassport
    And I have a vendor user entity reference
    And I call forVendorUser with the user reference
    Then it should return a UserVisa
    And the visa should deny all permissions

  Scenario: Using visa to determine permissions
    When I create a GuestUserPassport
    And I have an end user entity reference
    And I get a visa for the user
    And I use determineIf to check any permission
    Then it should return false