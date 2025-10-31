Feature: VendorUserUnitOfWork

  Background:
    Given a Mongoose context factory with a working service
    And a valid VendorUser model from the models context
    And a valid passport for domain operations

  Scenario: Creating a VendorUserUnitOfWork instance
    When I create a VendorUserUnitOfWork with the required dependencies
    Then it should return a VendorUserUnitOfWork instance
    And the Unit of Work should have the correct repository type
    And the Unit of Work should have the correct converter type
    And the Unit of Work should have the correct event buses