Feature: VendorUserRole Domain Adapter

  Background:
    Given a VendorUserRole document with populated community

  Scenario: Accessing roleName property
    When I access the roleName property
    Then I should get "Test Vendor Role"

  Scenario: Accessing isDefault property
    When I access the isDefault property
    Then I should get true

  Scenario: Accessing permissions property
    When I access the permissions property
    Then I should get a VendorUserRolePermissionsDomainAdapter instance