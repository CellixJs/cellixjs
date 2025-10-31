Feature: <DomainAdapter> VendorUserDomainAdapter

  Background:
    Given a valid Mongoose VendorUser document with userType "vendor-user", externalId "123e4567-e89b-12d3-a456-426614174001", email "vendor@example.com", displayName "Test Vendor", accessBlocked false, and tags ["tag1", "tag2"]

  Scenario: Getting the userType property
    Given a VendorUserDomainAdapter for the document
    When I get the userType property
    Then it should return "vendor-user"

  Scenario: Getting and setting the externalId property
    Given a VendorUserDomainAdapter for the document
    When I get the externalId property
    Then it should return "123e4567-e89b-12d3-a456-426614174001"
    When I set the externalId property to "123e4567-e89b-12d3-a456-426614174002"
    Then the document's externalId should be "123e4567-e89b-12d3-a456-426614174002"

  Scenario: Getting and setting the email property
    Given a VendorUserDomainAdapter for the document
    When I get the email property
    Then it should return "vendor@example.com"
    When I set the email property to "new-vendor@example.com"
    Then the document's email should be "new-vendor@example.com"

  Scenario: Getting and setting the displayName property
    Given a VendorUserDomainAdapter for the document
    When I get the displayName property
    Then it should return "Test Vendor"
    When I set the displayName property to "New Vendor Name"
    Then the document's displayName should be "New Vendor Name"

  Scenario: Getting and setting the accessBlocked property
    Given a VendorUserDomainAdapter for the document
    When I get the accessBlocked property
    Then it should return false
    When I set the accessBlocked property to true
    Then the document's accessBlocked should be true

  Scenario: Getting and setting the tags property
    Given a VendorUserDomainAdapter for the document
    When I get the tags property
    Then it should return ["tag1", "tag2"]
    When I set the tags property to ["tag3"]
    Then the document's tags should be ["tag3"]

  Scenario: Getting the personalInformation property
    Given a VendorUserDomainAdapter for the document
    When I get the personalInformation property
    Then it should return a VendorUserPersonalInformationDomainAdapter instance

  Scenario: Getting the personalInformation property when not defined on the document
    Given a VendorUserDomainAdapter for a document with no personalInformation
    When I get the personalInformation property
    Then it should return a VendorUserPersonalInformationDomainAdapter instance

  Scenario: Getting the identityDetails property from personalInformation
    Given a VendorUserDomainAdapter for the document
    When I get the personalInformation property
    And I get the identityDetails property
    Then it should return a VendorUserIdentityDetailsDomainAdapter instance

  Scenario: Getting and setting the lastName property from identityDetails
    Given a VendorUserDomainAdapter for the document
    When I get the personalInformation property
    And I get the identityDetails property
    And I get the lastName property
    Then it should return the correct lastName
    When I set the lastName property to "Smith"
    Then the identityDetails' lastName should be "Smith"

  Scenario: Getting and setting the legalNameConsistsOfOneName property from identityDetails
    Given a VendorUserDomainAdapter for the document
    When I get the personalInformation property
    And I get the identityDetails property
    And I get the legalNameConsistsOfOneName property
    Then it should return the correct value
    When I set the legalNameConsistsOfOneName property to true
    Then the identityDetails' legalNameConsistsOfOneName should be true

  Scenario: Getting and setting the restOfName property from identityDetails
    Given a VendorUserDomainAdapter for the document
    When I get the personalInformation property
    And I get the identityDetails property
    And I get the restOfName property
    Then it should return the correct restOfName
    When I set the restOfName property to "John"
    Then the identityDetails' restOfName should be "John"

  Scenario: Getting the contactInformation property from personalInformation
    Given a VendorUserDomainAdapter for the document
    When I get the personalInformation property
    And I get the contactInformation property
    Then it should return a VendorUserContactInformationDomainAdapter instance

  Scenario: Getting the contactInformation property when not defined on personalInformation
    Given a VendorUserDomainAdapter for a document with no contactInformation
    When I get the personalInformation property
    And I get the contactInformation property
    Then it should return a VendorUserContactInformationDomainAdapter instance

  Scenario: Getting and setting the email property from contactInformation
    Given a VendorUserDomainAdapter for the document
    When I get the personalInformation property
    And I get the contactInformation property
    And I get the email property
    Then it should return the correct email
    When I set the email property to "contact@example.com"
    Then the contactInformation's email should be "contact@example.com"