Feature: <Visa> MemberUserStaffUserVisa

  Background:
    Given a valid StaffUserEntityReference with id "staff-1"
    And a valid MemberEntityReference with id "member-1"

  Scenario: Creating a MemberUserStaffUserVisa
    When I create a MemberUserStaffUserVisa with the staff user and member
    Then the visa should be created successfully

  Scenario: determineIf returns true when the predicate returns true
    Given a MemberUserStaffUserVisa for the staff user and member
    When I call determineIf with a function that always returns true
    Then the result should be true

  Scenario: determineIf returns false when the predicate returns false
    Given a MemberUserStaffUserVisa for the staff user and member
    When I call determineIf with a function that always returns false
    Then the result should be false

  Scenario: determineIf always receives all permissions as false
    Given a MemberUserStaffUserVisa for the staff user and member
    When I call determineIf with a function that checks all permission flags
    Then all permission flags should be false

  Scenario: determineIf returns false for canManageEndUsers
    Given a MemberUserStaffUserVisa for the staff user and member
    When I call determineIf with a function that returns canManageEndUsers
    Then the result should be false

  Scenario: determineIf returns false for canManageStaffRolesAndPermissions
    Given a MemberUserStaffUserVisa for the staff user and member
    When I call determineIf with a function that returns canManageStaffRolesAndPermissions
    Then the result should be false

  Scenario: determineIf returns false for canManageStaffUsers
    Given a MemberUserStaffUserVisa for the staff user and member
    When I call determineIf with a function that returns canManageStaffUsers
    Then the result should be false

  Scenario: determineIf returns false for canManageVendorUsers
    Given a MemberUserStaffUserVisa for the staff user and member
    When I call determineIf with a function that returns canManageVendorUsers
    Then the result should be false

  Scenario: determineIf returns false for isEditingOwnAccount
    Given a MemberUserStaffUserVisa for the staff user and member
    When I call determineIf with a function that returns isEditingOwnAccount
    Then the result should be false

  Scenario: determineIf returns false for isSystemAccount
    Given a MemberUserStaffUserVisa for the staff user and member
    When I call determineIf with a function that returns isSystemAccount
    Then the result should be false
