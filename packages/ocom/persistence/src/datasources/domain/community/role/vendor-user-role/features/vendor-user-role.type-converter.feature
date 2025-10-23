Feature: <TypeConverter> VendorUserRoleConverter

  Background:
    Given a valid Mongoose VendorUserRole document with roleName "Test Vendor Role", isDefault true, populated community field, and permissions

  Scenario: Converting a Mongoose VendorUserRole document to a domain object
    Given a VendorUserRoleConverter instance
    When I call toDomain with the Mongoose VendorUserRole document
    Then I should receive a VendorUserRole domain object
    And the domain object's roleName should be "Test Vendor Role"
    And the domain object's isDefault should be true
    And the domain object's community should be a Community domain object

  Scenario: Converting a domain object to a Mongoose VendorUserRole document
    Given a VendorUserRoleConverter instance
    And a VendorUserRole domain object with roleName "New Role", isDefault false, and valid community
    When I call toPersistence with the VendorUserRole domain object
    Then I should receive a Mongoose VendorUserRole document
    And the document's roleName should be "New Role"
    And the document's isDefault should be false
    And the document's community should be set to the correct community document