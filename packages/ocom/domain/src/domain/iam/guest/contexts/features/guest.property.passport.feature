Feature: GuestPropertyPassport

  Scenario: Creating GuestPropertyPassport and getting visa for property
    When I create a GuestPropertyPassport
    And I have a property entity reference
    And I call forProperty with the property reference
    Then it should return a PropertyVisa
    And the visa should deny all permissions