Feature: VendorUserRole Repository

  Background:
    Given a VendorUserRoleRepository instance with a working Mongoose model, type converter, and passport
    And a valid Mongoose VendorUserRole document with id "507f1f77bcf86cd799439011", roleName "Test Vendor Role", and a populated community field

  Scenario: Getting a vendor user role by id
    When I call getById with "507f1f77bcf86cd799439011"
    Then I should receive a VendorUserRole domain object
    And the domain object's roleName should be "Test Vendor Role"

  Scenario: Getting a vendor user role by id that does not exist
    When I call getById with "nonexistent-id"
    Then an error should be thrown indicating "VendorUserRole with id nonexistent-id not found"

  Scenario: Creating a new vendor user role instance
    Given a valid Community domain object as the community
    When I call getNewInstance with roleName "New Vendor Role", isDefault false, and the community
    Then I should receive a new VendorUserRole domain object
    And the domain object's roleName should be "New Vendor Role"
    And the domain object's isDefault should be false