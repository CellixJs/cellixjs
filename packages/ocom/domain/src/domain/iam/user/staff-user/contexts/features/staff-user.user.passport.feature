Feature: StaffUserUserPassport

  Background:
    Given a valid StaffUserEntityReference with externalId "ext-1" and canManageStaffRolesAndPermissions true

  Scenario: Creating a StaffUserUserPassport with a staff user
    When I create a StaffUserUserPassport with the staff user
    Then the passport should be created successfully

  Scenario: forEndUser returns a visa where canManageStaffRolesAndPermissions is true
    Given a StaffUserUserPassport for the staff user
    When I call forEndUser with any EndUserEntityReference
    Then determineIf should return true for canManageStaffRolesAndPermissions
    And determineIf should return false for canManageEndUsers
    And determineIf should return false for canManageVendorUsers
    And determineIf should return false for isSystemAccount
    And determineIf should return false for isEditingOwnAccount

  Scenario: forEndUser when the staff user has no role returns a visa with all permissions false
    Given a StaffUserEntityReference with no role
    And a StaffUserUserPassport for that staff user
    When I call forEndUser with any EndUserEntityReference
    Then determineIf should return false for canManageStaffRolesAndPermissions

  Scenario: forStaffUser called with own staff user sets isEditingOwnAccount true
    Given a StaffUserUserPassport for the staff user
    When I call forStaffUser with the same staff user as the root
    Then determineIf should return true for isEditingOwnAccount
    And determineIf should return true for canManageStaffRolesAndPermissions

  Scenario: forStaffUser called with a different staff user sets isEditingOwnAccount false
    Given a StaffUserUserPassport for the staff user
    When I call forStaffUser with a different StaffUserEntityReference
    Then determineIf should return false for isEditingOwnAccount
    And determineIf should return true for canManageStaffRolesAndPermissions

  Scenario: forStaffRole returns a visa where canManageStaffRolesAndPermissions is true
    Given a StaffUserUserPassport for the staff user
    When I call forStaffRole with any StaffRoleEntityReference
    Then determineIf should return true for canManageStaffRolesAndPermissions
    And determineIf should return false for isEditingOwnAccount

  Scenario: forVendorUser returns a visa where canManageStaffRolesAndPermissions is true
    Given a StaffUserUserPassport for the staff user
    When I call forVendorUser with any VendorUserEntityReference
    Then determineIf should return true for canManageStaffRolesAndPermissions
    And determineIf should return false for canManageVendorUsers
