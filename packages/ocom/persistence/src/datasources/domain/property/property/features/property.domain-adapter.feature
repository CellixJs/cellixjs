Feature: <DomainAdapter> PropertyDomainAdapter

  Background:
    Given a valid Mongoose Property document with propertyName "Test Property", propertyType "house", and populated community and owner fields

  Scenario: Getting and setting the propertyName property
    Given a PropertyDomainAdapter for the document
    When I get the propertyName property
    Then it should return "Test Property"
    When I set the propertyName property to "Updated Property"
    Then the document's propertyName should be "Updated Property"

  Scenario: Getting and setting the propertyType property
    Given a PropertyDomainAdapter for the document
    When I get the propertyType property
    Then it should return "house"
    When I set the propertyType property to "apartment"
    Then the document's propertyType should be "apartment"

  Scenario: Getting and setting the listedForSale property
    Given a PropertyDomainAdapter for the document
    When I get the listedForSale property
    Then it should return true
    When I set the listedForSale property to false
    Then the document's listedForSale should be false

  Scenario: Getting and setting the listedForRent property
    Given a PropertyDomainAdapter for the document
    When I get the listedForRent property
    Then it should return false
    When I set the listedForRent property to true
    Then the document's listedForRent should be true

  Scenario: Getting and setting the listedForLease property
    Given a PropertyDomainAdapter for the document
    When I get the listedForLease property
    Then it should return false
    When I set the listedForLease property to true
    Then the document's listedForLease should be true

  Scenario: Getting and setting the listedInDirectory property
    Given a PropertyDomainAdapter for the document
    When I get the listedInDirectory property
    Then it should return true
    When I set the listedInDirectory property to false
    Then the document's listedInDirectory should be false

  Scenario: Getting and setting the tags property
    Given a PropertyDomainAdapter for the document
    When I get the tags property
    Then it should return ["tag1", "tag2"]
    When I set the tags property to ["newTag1", "newTag2"]
    Then the document's tags should be ["newTag1", "newTag2"]

  Scenario: Getting and setting the hash property
    Given a PropertyDomainAdapter for the document
    When I get the hash property
    Then it should return undefined
    When I set the hash property to "test-hash"
    Then the document's hash should be "test-hash"

  Scenario: Getting and setting the lastIndexed property
    Given a PropertyDomainAdapter for the document
    When I get the lastIndexed property
    Then it should return undefined
    When I set the lastIndexed property to a date
    Then the document's lastIndexed should be that date

  Scenario: Getting and setting the updateIndexFailedDate property
    Given a PropertyDomainAdapter for the document
    When I get the updateIndexFailedDate property
    Then it should return undefined
    When I set the updateIndexFailedDate property to a date
    Then the document's updateIndexFailedDate should be that date

  Scenario: Getting the location property
    Given a PropertyDomainAdapter for the document
    When I get the location property
    Then it should return a PropertyLocationDomainAdapter instance
    When I get the address property from the location
    Then it should return a PropertyLocationAddressDomainAdapter instance
    When I get the position property from the location
    Then it should return a PropertyLocationPositionDomainAdapter instance

  Scenario: Getting the communityId property
    Given a PropertyDomainAdapter for the document
    When I get the communityId property
    Then it should return the community's id as a string

  Scenario: Getting the community property when populated
    Given a PropertyDomainAdapter for the document
    When I get the community property
    Then it should return a CommunityDomainAdapter instance with the correct community data

  Scenario: Getting the community property when not populated
    Given a PropertyDomainAdapter for a document with community as an ObjectId
    When I get the community property
    Then an error should be thrown indicating "community is not populated or is not of the correct type"

  Scenario: Loading the community
    Given a PropertyDomainAdapter for a document with community as an ObjectId
    When I load the community
    Then it should populate and return the community

  Scenario: Setting the community property with a valid Community domain object
    Given a PropertyDomainAdapter for the document
    And a valid Community domain object
    When I set the community property to the Community domain object
    Then the document's community should be set to the community's doc

  Scenario: Setting the community property with an invalid value
    Given a PropertyDomainAdapter for the document
    And an object that is not a Community domain object
    When I try to set the community property to the invalid object
    Then an error should be thrown indicating "community reference is missing id"

  Scenario: Getting the ownerId property
    Given a PropertyDomainAdapter for the document
    When I get the ownerId property
    Then it should return the owner's id as a string

  Scenario: Getting the owner property when populated
    Given a PropertyDomainAdapter for the document
    When I get the owner property
    Then it should return a MemberEntityReference instance

  Scenario: Getting the owner property when not populated
    Given a PropertyDomainAdapter for a document with owner as an ObjectId
    When I get the owner property
    Then an error should be thrown indicating "owner is not populated or is not of the correct type"

  Scenario: Loading the owner
    Given a PropertyDomainAdapter for a document with owner as an ObjectId
    When I load the owner
    Then it should populate and return the owner

  Scenario: Setting the owner property with a valid Member domain object
    Given a PropertyDomainAdapter for the document
    And a valid Member domain object
    When I set the owner property to the Member domain object
    Then the document's owner should be set to the member's doc

  Scenario: Setting the owner property with an invalid value
    Given a PropertyDomainAdapter for the document
    And an object that is not a Member domain object
    When I try to set the owner property to the invalid object
    Then an error should be thrown indicating "owner reference is missing id"

  Scenario: Getting the createdAt property
    Given a PropertyDomainAdapter for the document
    When I get the createdAt property
    Then it should return the createdAt date

  Scenario: Getting the updatedAt property
    Given a PropertyDomainAdapter for the document
    When I get the updatedAt property
    Then it should return the updatedAt date

  Scenario: Getting the schemaVersion property
    Given a PropertyDomainAdapter for the document
    When I get the schemaVersion property
    Then it should return the schemaVersion number

  Scenario: Getting and setting address properties
    Given a PropertyDomainAdapter for the document
    When I get the streetNumber property from the address
    Then the streetNumber should be an empty string
    When I set the streetNumber property to "123"
    Then the document's address streetNumber should be "123"
    When I get the streetName property from the address
    Then the streetName should be an empty string
    When I set the streetName property to "Main St"
    Then the document's address streetName should be "Main St"
    When I get the municipality property from the address
    Then the municipality should be an empty string
    When I set the municipality property to "Anytown"
    Then the document's address municipality should be "Anytown"
    When I get the municipalitySubdivision property from the address
    Then the municipalitySubdivision should be an empty string
    When I set the municipalitySubdivision property to "Subdivision"
    Then the document's address municipalitySubdivision should be "Subdivision"
    When I get the localName property from the address
    Then the localName should be an empty string
    When I set the localName property to "Local Name"
    Then the document's address localName should be "Local Name"
    When I get the countrySecondarySubdivision property from the address
    Then the countrySecondarySubdivision should be an empty string
    When I set the countrySecondarySubdivision property to "Secondary"
    Then the document's address countrySecondarySubdivision should be "Secondary"
    When I get the countryTertiarySubdivision property from the address
    Then the countryTertiarySubdivision should be an empty string
    When I set the countryTertiarySubdivision property to "Tertiary"
    Then the document's address countryTertiarySubdivision should be "Tertiary"
    When I get the countrySubdivision property from the address
    Then the countrySubdivision should be an empty string
    When I set the countrySubdivision property to "State"
    Then the document's address countrySubdivision should be "State"
    When I get the countrySubdivisionName property from the address
    Then the countrySubdivisionName should be an empty string
    When I set the countrySubdivisionName property to "State Name"
    Then the document's address countrySubdivisionName should be "State Name"
    When I get the postalCode property from the address
    Then the postalCode should be an empty string
    When I set the postalCode property to "12345"
    Then the document's address postalCode should be "12345"
    When I get the extendedPostalCode property from the address
    Then the extendedPostalCode should be an empty string
    When I set the extendedPostalCode property to "6789"
    Then the document's address extendedPostalCode should be "6789"
    When I get the countryCode property from the address
    Then the countryCode should be an empty string
    When I set the countryCode property to "US"
    Then the document's address countryCode should be "US"
    When I get the country property from the address
    Then the country should be an empty string
    When I set the country property to "USA"
    Then the document's address country should be "USA"
    When I get the countryCodeISO3 property from the address
    Then the countryCodeISO3 should be an empty string
    When I set the countryCodeISO3 property to "USA"
    Then the document's address countryCodeISO3 should be "USA"
    When I get the freeformAddress property from the address
    Then the freeformAddress should be an empty string
    When I set the freeformAddress property to "123 Main St, Anytown"
    Then the document's address freeformAddress should be "123 Main St, Anytown"
    When I get the streetNameAndNumber property from the address
    Then the streetNameAndNumber should be an empty string
    When I set the streetNameAndNumber property to "123 Main St"
    Then the document's address streetNameAndNumber should be "123 Main St"
    When I get the routeNumbers property from the address
    Then the routeNumbers should be an empty string
    When I set the routeNumbers property to "I-95"
    Then the document's address routeNumbers should be "I-95"
    When I get the crossStreet property from the address
    Then the crossStreet should be an empty string
    When I set the crossStreet property to "Elm St"
    Then the document's address crossStreet should be "Elm St"

  Scenario: Getting and setting position properties
    Given a PropertyDomainAdapter for the document
    When I get the type property from the position
    Then it should return "Point"
    When I set the type property to "Polygon"
    Then the document's position type should be "Polygon"
    When I get the coordinates property from the position
    Then it should return [40.7128, -74.0060]
    When I set the coordinates property to [41.7128, -75.0060]
    Then the document's position coordinates should be [41.7128, -75.0060]

  Scenario: Getting and setting listing detail properties
    Given a PropertyDomainAdapter for the document
    When I get the price property from the listingDetail
    Then the price should be 100000
    When I set the price property to 250000
    Then the document's listingDetail price should be 250000
    When I get the description property from the listingDetail
    Then the description should be "Test description"
    When I set the description property to "Beautiful home"
    Then the document's listingDetail description should be "Beautiful home"
    When I get the rentHigh property from the listingDetail
    Then the rentHigh should be null
    When I set the rentHigh property to 3000
    Then the document's listingDetail rentHigh should be 3000
    When I get the rentLow property from the listingDetail
    Then the rentLow should be null
    When I set the rentLow property to 2500
    Then the document's listingDetail rentLow should be 2500
    When I get the lease property from the listingDetail
    Then the lease should be null
    When I set the lease property to 1
    Then the document's listingDetail lease should be 1
    When I get the maxGuests property from the listingDetail
    Then the maxGuests should be null
    When I set the maxGuests property to 6
    Then the document's listingDetail maxGuests should be 6
    When I get the bedrooms property from the listingDetail
    Then the bedrooms should be null
    When I set the bedrooms property to 3
    Then the document's listingDetail bedrooms should be 3
    When I get the bedroomDetails property from the listingDetail
    Then the bedroomDetails should be a MongoosePropArray
    When I get the bathrooms property from the listingDetail
    Then the bathrooms should be null
    When I set the bathrooms property to 2
    Then the document's listingDetail bathrooms should be 2
    When I get the squareFeet property from the listingDetail
    Then the squareFeet should be null
    When I set the squareFeet property to 2000
    Then the document's listingDetail squareFeet should be 2000
    When I get the yearBuilt property from the listingDetail
    Then the yearBuilt should be null
    When I set the yearBuilt property to 1995
    Then the document's listingDetail yearBuilt should be 1995
    When I get the lotSize property from the listingDetail
    Then the lotSize should be null
    When I set the lotSize property to 0.5
    Then the document's listingDetail lotSize should be 0.5
    When I get the amenities property from the listingDetail
    Then the amenities should be an empty array
    When I set the amenities property to ["pool", "gym"]
    Then the document's listingDetail amenities should be ["pool", "gym"]
    When I get the additionalAmenities property from the listingDetail
    Then the additionalAmenities should be a MongoosePropArray
    When I get the images property from the listingDetail
    Then the images should be an empty array
    When I set the images property to ["image1.jpg", "image2.jpg"]
    Then the document's listingDetail images should be ["image1.jpg", "image2.jpg"]
    When I get the video property from the listingDetail
    Then the video should be null
    When I set the video property to "video.mp4"
    Then the document's listingDetail video should be "video.mp4"
    When I get the floorPlan property from the listingDetail
    Then the floorPlan should be null
    When I set the floorPlan property to "floorplan.pdf"
    Then the document's listingDetail floorPlan should be "floorplan.pdf"
    When I get the floorPlanImages property from the listingDetail
    Then the floorPlanImages should be an empty array
    When I set the floorPlanImages property to ["fp1.jpg", "fp2.jpg"]
    Then the document's listingDetail floorPlanImages should be ["fp1.jpg", "fp2.jpg"]
    When I get the listingAgent property from the listingDetail
    Then the listingAgent should be null
    When I set the listingAgent property to "John Doe"
    Then the document's listingDetail listingAgent should be "John Doe"
    When I get the listingAgentPhone property from the listingDetail
    Then the listingAgentPhone should be null
    When I set the listingAgentPhone property to "555-1234"
    Then the document's listingDetail listingAgentPhone should be "555-1234"
    When I get the listingAgentEmail property from the listingDetail
    Then the listingAgentEmail should be null
    When I set the listingAgentEmail property to "john@example.com"
    Then the document's listingDetail listingAgentEmail should be "john@example.com"
    When I get the listingAgentWebsite property from the listingDetail
    Then the listingAgentWebsite should be null
    When I set the listingAgentWebsite property to "http://john.com"
    Then the document's listingDetail listingAgentWebsite should be "http://john.com"
    When I get the listingAgentCompany property from the listingDetail
    Then the listingAgentCompany should be null
    When I set the listingAgentCompany property to "Real Estate Co"
    Then the document's listingDetail listingAgentCompany should be "Real Estate Co"
    When I get the listingAgentCompanyPhone property from the listingDetail
    Then the listingAgentCompanyPhone should be null
    When I set the listingAgentCompanyPhone property to "555-5678"
    Then the document's listingDetail listingAgentCompanyPhone should be "555-5678"
    When I get the listingAgentCompanyEmail property from the listingDetail
    Then the listingAgentCompanyEmail should be null
    When I set the listingAgentCompanyEmail property to "info@realestate.com"
    Then the document's listingDetail listingAgentCompanyEmail should be "info@realestate.com"
    When I get the listingAgentCompanyWebsite property from the listingDetail
    Then the listingAgentCompanyWebsite should be null
    When I set the listingAgentCompanyWebsite property to "http://realestate.com"
    Then the document's listingDetail listingAgentCompanyWebsite should be "http://realestate.com"
    When I get the listingAgentCompanyAddress property from the listingDetail
    Then the listingAgentCompanyAddress should be null
    When I set the listingAgentCompanyAddress property to "123 Office St"
    Then the document's listingDetail listingAgentCompanyAddress should be "123 Office St"