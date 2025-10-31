Feature: <DomainAdapter> StaffUserDomainAdapter

  Background:
    Given a valid Mongoose StaffUser document with firstName "John", lastName "Doe", email "john.doe@example.com", displayName "John Doe", externalId "12345678-1234-1234-1234-123456789012", accessBlocked false

  Scenario: Getting and setting the role property
    Given a StaffUserDomainAdapter for the document
    When I get the role property
    Then it should return undefined
    When I set the role reference to a valid role
    Then the document's role should be set to the ObjectId

  Scenario: Setting role reference to undefined
    Given a StaffUserDomainAdapter for the document
    When I set the role reference to undefined
    Then the document's role should be undefined

  Scenario: Getting and setting the firstName property
    Given a StaffUserDomainAdapter for the document
    When I get the firstName property
    Then it should return "John"
    When I set the firstName property to "Jane"
    Then the document's firstName should be "Jane"

  Scenario: Getting and setting the lastName property
    Given a StaffUserDomainAdapter for the document
    When I get the lastName property
    Then it should return "Doe"
    When I set the lastName property to "Smith"
    Then the document's lastName should be "Smith"

  Scenario: Getting and setting the email property
    Given a StaffUserDomainAdapter for the document
    When I get the email property
    Then it should return "john.doe@example.com"
    When I set the email property to "jane.smith@example.com"
    Then the document's email should be "jane.smith@example.com"

  Scenario: Getting and setting the displayName property
    Given a StaffUserDomainAdapter for the document
    When I get the displayName property
    Then it should return "John Doe"
    When I set the displayName property to "Jane Smith"
    Then the document's displayName should be "Jane Smith"

  Scenario: Getting and setting the externalId property
    Given a StaffUserDomainAdapter for the document
    When I get the externalId property
    Then it should return "12345678-1234-1234-1234-123456789012"
    When I set the externalId property to "87654321-4321-4321-4321-210987654321"
    Then the document's externalId should be "87654321-4321-4321-4321-210987654321"

  Scenario: Getting and setting the accessBlocked property
    Given a StaffUserDomainAdapter for the document
    When I get the accessBlocked property
    Then it should return false
    When I set the accessBlocked property to true
    Then the document's accessBlocked should be true

  Scenario: Getting and setting the tags property
    Given a StaffUserDomainAdapter for the document
    When I get the tags property
    Then it should return an empty array
    When I set the tags property to ["admin", "manager"]
    Then the document's tags should be ["admin", "manager"]

  Scenario: Getting readonly properties
    Given a StaffUserDomainAdapter for the document
    When I get the userType property
    Then it should return "staff-user"
    When I get the createdAt property
    Then it should return a Date for createdAt
    When I get the updatedAt property
    Then it should return a Date for updatedAt
    When I get the schemaVersion property
    Then it should return "1.0.0" for schemaVersion

  Scenario: Getting role when populated
    Given a StaffUserDomainAdapter for the document with populated role
    When I get the role property
    Then it should return a StaffRoleProps object

  Scenario: Getting role when role is ObjectId
    Given a StaffUserDomainAdapter for the document with role as ObjectId
    When I get the role property
    Then the role should be undefined