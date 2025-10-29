Feature: <AggregateRoot> Property

  Background:
    Given a valid Passport with property permissions
    And a valid CommunityEntityReference
    And base property properties with propertyName "Test Property", propertyType "House", listedForSale true, listedForRent false, listedForLease false, listedInDirectory true, a valid community, owner, location, listingDetail, and valid timestamps

  Scenario: Creating a new property instance
    When I create a new Property aggregate using getNewInstance with propertyName "New Property", and a CommunityEntityReference
    Then the property's propertyName should be "New Property"
    And the property's community should reference the provided CommunityEntityReference
    And the property's listedForSale should be false
    And the property's listedForRent should be false
    And the property's listedForLease should be false
    And the property's listedInDirectory should be false

  Scenario: Changing the propertyName with permission to manage properties
    Given a Property aggregate with permission to manage properties
    When I set the propertyName to "Updated Property"
    Then the property's propertyName should be "Updated Property"

  Scenario: Changing the propertyName without permission
    Given a Property aggregate without permission to manage properties
    When I try to set the propertyName to "Updated Property"
    Then a PermissionError should be thrown

  Scenario: Changing the propertyName to an invalid value
    Given a Property aggregate with permission to manage properties
    When I try to set the propertyName to an invalid value (e.g., null or empty string)
    Then an error should be thrown indicating the value is invalid

  Scenario: Changing the propertyType with permission to manage properties
    Given a Property aggregate with permission to manage properties
    When I set the propertyType to "Apartment"
    Then the property's propertyType should be "Apartment"

  Scenario: Changing the propertyType without permission
    Given a Property aggregate without permission to manage properties
    When I try to set the propertyType to "Apartment"
    Then a PermissionError should be thrown

  Scenario: Changing the propertyType to an invalid value
    Given a Property aggregate with permission to manage properties
    When I try to set the propertyType to an invalid value (e.g., null or empty string)
    Then an error should be thrown indicating the value is invalid

  Scenario: Changing listedForSale with permission to manage properties
    Given a Property aggregate with permission to manage properties
    When I set listedForSale to false
    Then the property's listedForSale should be false

  Scenario: Changing listedForSale without permission
    Given a Property aggregate without permission to manage properties
    When I try to set listedForSale to false
    Then a PermissionError should be thrown

  Scenario: Changing listedForRent with permission to manage properties
    Given a Property aggregate with permission to manage properties
    When I set listedForRent to true
    Then the property's listedForRent should be true

  Scenario: Changing listedForRent without permission
    Given a Property aggregate without permission to manage properties
    When I try to set listedForRent to true
    Then a PermissionError should be thrown

  Scenario: Changing listedForLease with permission to manage properties
    Given a Property aggregate with permission to manage properties
    When I set listedForLease to true
    Then the property's listedForLease should be true

  Scenario: Changing listedForLease without permission
    Given a Property aggregate without permission to manage properties
    When I try to set listedForLease to true
    Then a PermissionError should be thrown

  Scenario: Changing listedInDirectory with permission to manage properties
    Given a Property aggregate with permission to manage properties
    When I set listedInDirectory to false
    Then the property's listedInDirectory should be false

  Scenario: Changing listedInDirectory without permission
    Given a Property aggregate without permission to manage properties
    When I try to set listedInDirectory to false
    Then a PermissionError should be thrown

  Scenario: Getting createdAt, updatedAt, and schemaVersion
    Given a Property aggregate
    Then the createdAt property should return the correct date
    And the updatedAt property should return the correct date
    And the schemaVersion property should return the correct version

  Scenario: Requesting property deletion with permission
    Given a Property aggregate with permission to manage properties
    When I request to delete the property
    Then the property should be marked as deleted
    And a PropertyDeletedEvent should be added to integration events

  Scenario: Requesting property deletion without permission
    Given a Property aggregate without permission to manage properties
    When I try to request deletion of the property
    Then a PermissionError should be thrown