Feature: VendorUserRepository

  Background:
    Given a VendorUserRepository instance with a working Mongoose model, type converter, and passport
    And a VendorUser document with ID "507f1f77bcf86cd799439011" and externalId "123e4567-e89b-12d3-a456-426614174001"

  Scenario: Getting a VendorUser by ID
    When I call getById with ID "507f1f77bcf86cd799439011"
    Then it should return the VendorUser domain object
    And the domain object's externalId should be "123e4567-e89b-12d3-a456-426614174001"

  Scenario: Getting a VendorUser by external ID
    When I call getByExternalId with externalId "123e4567-e89b-12d3-a456-426614174001"
    Then it should return the VendorUser domain object
    And the domain object's externalId should be "123e4567-e89b-12d3-a456-426614174001"

  Scenario: Deleting a VendorUser by ID
    When I call delete with ID "507f1f77bcf86cd799439011"
    Then the VendorUser document should be deleted from the database

  Scenario: Creating a new VendorUser instance
    When I call getNewInstance with externalId "123e4567-e89b-12d3-a456-426614174002", lastName "Smith", and restOfName "John"
    Then it should return a new VendorUser domain object
    And the domain object's externalId should be "123e4567-e89b-12d3-a456-426614174002"
    And the domain object's lastName should be "Smith"
    And the domain object's restOfName should be "John"