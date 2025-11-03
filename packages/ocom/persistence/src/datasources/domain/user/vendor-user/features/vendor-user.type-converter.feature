Feature: <TypeConverter> VendorUserConverter

  Background:
    Given a valid Mongoose VendorUser document with userType "vendor-user", externalId "123e4567-e89b-12d3-a456-426614174001", email "vendor@example.com", displayName "Test Vendor", accessBlocked false, and tags ["tag1", "tag2"]

  Scenario: Converting a Mongoose VendorUser document to a domain object
    Given a VendorUserConverter instance
    When I call toDomain with the Mongoose VendorUser document
    Then I should receive a VendorUser domain object
    And the domain object's userType should be "vendor-user"
    And the domain object's externalId should be "123e4567-e89b-12d3-a456-426614174001"
    And the domain object's email should be "vendor@example.com"
    And the domain object's displayName should be "Test Vendor"
    And the domain object's accessBlocked should be false
    And the domain object's tags should be ["tag1", "tag2"]

  Scenario: Converting a domain object to a Mongoose VendorUser document
    Given a VendorUserConverter instance
    And a VendorUser domain object with userType "vendor-user", externalId "123e4567-e89b-12d3-a456-426614174002", email "new-vendor@example.com", displayName "New Vendor", accessBlocked true, and tags ["tag3"]
    When I call toPersistence with the VendorUser domain object
    Then I should receive a Mongoose VendorUser document
    And the document's userType should be "vendor-user"
    And the document's externalId should be "123e4567-e89b-12d3-a456-426614174002"
    And the document's email should be "new-vendor@example.com"
    And the document's displayName should be "New Vendor"
    And the document's accessBlocked should be true
    And the document's tags should be ["tag3"]