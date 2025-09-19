Feature: <Visa> MemberUserStaffRoleVisa

  Background:
    Given a valid StaffRoleEntityReference with id "role-1"
    And a valid MemberEntityReference with id "member-1"

  Scenario: Creating a MemberUserStaffRoleVisa
    When I create a MemberUserStaffRoleVisa with the staff role and member
    Then the visa should be created successfully

  Scenario: determineIf returns true when the predicate returns true
    Given a MemberUserStaffRoleVisa for the staff role and member
    When I call determineIf with a function that always returns true
    Then the result should be true

  Scenario: determineIf returns false when the predicate returns false
    Given a MemberUserStaffRoleVisa for the staff role and member
    When I call determineIf with a function that always returns false
    Then the result should be false

  Scenario: determineIf always receives all permissions as false
    Given a MemberUserStaffRoleVisa for the staff role and member
    When I call determineIf with a function that checks all permission flags
    Then all permission flags should be false

  Scenario: determineIf returns false for canManageEndUsers
    Given a MemberUserStaffRoleVisa for the staff role and member
    When I call determineIf with a function that returns canManageEndUsers
    Then the result should be false

  Scenario: determineIf returns false for canManageStaffRolesAndPermissions
    Given a MemberUserStaffRoleVisa for the staff role and member
    When I call determineIf with a function that returns canManageStaffRolesAndPermissions
    Then the result should be false

  Scenario: determineIf returns false for canManageStaffUsers
    Given a MemberUserStaffRoleVisa for the staff role and member
    When I call determineIf with a function that returns canManageStaffUsers
    Then the result should be false

  Scenario: determineIf returns false for canManageVendorUsers
    Given a MemberUserStaffRoleVisa for the staff role and member
    When I call determineIf with a function that returns canManageVendorUsers
    Then the result should be false

  Scenario: determineIf returns false for isEditingOwnAccount
    Given a MemberUserStaffRoleVisa for the staff role and member
    When I call determineIf with a function that returns isEditingOwnAccount
    Then the result should be false

  Scenario: determineIf returns false for isSystemAccount
    Given a MemberUserStaffRoleVisa for the staff role and member
    When I call determineIf with a function that returns isSystemAccount
    Then the result should be false
