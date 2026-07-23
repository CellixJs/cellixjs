Feature: <Repository> StaffUserRepository

  Background:
    Given a StaffUserRepository instance with a valid model and passport

  Scenario: Getting a staff user by ID
    Given a staff user exists in the database with ID "507f1f77bcf86cd799439011"
    When I call getById with "507f1f77bcf86cd799439011"
    Then it should return the staff user aggregate by ID
    And the staff user by ID should have the correct properties

  Scenario: Getting a staff user by ID that doesn't exist
    Given no staff user exists with ID "507f1f77bcf86cd799439012"
    When I call getById with "507f1f77bcf86cd799439012"
    Then it should throw an error indicating "StaffUser with id 507f1f77bcf86cd799439012 not found"

  Scenario: Getting a staff user by external ID
    Given a staff user exists in the database with externalId "12345678-1234-1234-8123-123456789012"
    When I call getByExternalId with "12345678-1234-1234-8123-123456789012"
    Then it should return the staff user aggregate by external ID
    And the staff user by external ID should have the correct properties

  Scenario: Getting a staff user by external ID that doesn't exist
    Given no staff user exists with externalId "87654321-4321-4321-4321-210987654321"
    When I call getByExternalId with "87654321-4321-4321-4321-210987654321"
    Then it should throw an error indicating "StaffUser with externalId 87654321-4321-4321-4321-210987654321 not found"

  Scenario: Getting all staff users assigned to a role
    Given two staff users are assigned to the role with ID "607f1f77bcf86cd799439099"
    When I call getAllAssignedToRole with "607f1f77bcf86cd799439099"
    Then it should return the staff user aggregates assigned to that role

  Scenario: Getting all staff users assigned to a role with no assignees
    Given no staff users are assigned to the role with ID "607f1f77bcf86cd799439100"
    When I call getAllAssignedToRole with "607f1f77bcf86cd799439100"
    Then it should return an empty list

  Scenario: Conditionally updating a staff user's role
    Given a staff user is still assigned to role "607f1f77bcf86cd799439099"
    When I conditionally replace that role with "607f1f77bcf86cd799439100"
    Then the role and audit entry should be updated in the User transaction
    And the conditional update should report success

  Scenario: Conditional role update loses to a newer assignment
    Given a staff user's role no longer matches "607f1f77bcf86cd799439099"
    When I conditionally replace that role with "607f1f77bcf86cd799439100"
    Then the conditional update should report no change

  Scenario: Creating a new staff user instance
    Given valid parameters for a new staff user
    When I call getNewInstance with externalId "12345678-1234-1234-8123-123456789012", firstName "John", lastName "Doe", email "john.doe@example.com"
    Then it should return a new staff user aggregate
    And the new staff user should have tags set to an empty array
    And the new staff user should have accessBlocked set to false

  Scenario: Deleting a staff user by ID
    Given a staff user exists in the database with ID "507f1f77bcf86cd799439011"
    When I call delete with "507f1f77bcf86cd799439011"
    Then the staff user should be deleted from the database