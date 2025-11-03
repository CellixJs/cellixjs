Feature: <Entity> Property Listing Detail Entity

  Scenario: Creating a property listing detail with valid props
    When I create a property listing detail with valid props
    Then the property listing detail should be created successfully

  Scenario: Setting price with proper permissions
    Given a property listing detail exists
    When I set the price with proper permissions
    Then the price should be updated

  Scenario: Setting price without proper permissions
    Given a property listing detail exists
    When I try to set the price without proper permissions
    Then a permission error should be thrown

  Scenario: Accessing bedroom details
    Given a property listing detail exists
    When I access the bedroom details
    Then it should return the bedroom details

  Scenario: Requesting new bedroom with proper permissions
    Given a property listing detail exists
    When I request a new bedroom with proper permissions
    Then a new bedroom should be returned

  Scenario: Requesting new bedroom without proper permissions
    Given a property listing detail exists
    When I try to request a new bedroom without proper permissions
    Then a permission error should be thrown

  Scenario: Accessing additional amenities
    Given a property listing detail exists
    When I access the additional amenities
    Then it should return the additional amenities

  Scenario: Requesting new additional amenity with proper permissions
    Given a property listing detail exists
    When I request a new additional amenity with proper permissions
    Then a new additional amenity should be returned

  Scenario: Removing image with proper permissions
    Given a property listing detail exists
    When I remove an image with proper permissions
    Then the image should be removed

  Scenario: Setting rentHigh with proper permissions
    Given a property listing detail exists
    When I set the rentHigh with proper permissions
    Then the rentHigh should be updated

  Scenario: Setting rentHigh without proper permissions
    Given a property listing detail exists
    When I try to set the rentHigh without proper permissions
    Then a permission error should be thrown

  Scenario: Setting rentLow with proper permissions
    Given a property listing detail exists
    When I set the rentLow with proper permissions
    Then the rentLow should be updated

  Scenario: Setting rentLow without proper permissions
    Given a property listing detail exists
    When I try to set the rentLow without proper permissions
    Then a permission error should be thrown

  Scenario: Setting lease with proper permissions
    Given a property listing detail exists
    When I set the lease with proper permissions
    Then the lease should be updated

  Scenario: Setting lease without proper permissions
    Given a property listing detail exists
    When I try to set the lease without proper permissions
    Then a permission error should be thrown

  Scenario: Setting maxGuests with proper permissions
    Given a property listing detail exists
    When I set the maxGuests with proper permissions
    Then the maxGuests should be updated

  Scenario: Setting maxGuests without proper permissions
    Given a property listing detail exists
    When I try to set the maxGuests without proper permissions
    Then a permission error should be thrown

  Scenario: Setting bedrooms with proper permissions
    Given a property listing detail exists
    When I set the bedrooms with proper permissions
    Then the bedrooms should be updated

  Scenario: Setting bedrooms without proper permissions
    Given a property listing detail exists
    When I try to set the bedrooms without proper permissions
    Then a permission error should be thrown

  Scenario: Setting bathrooms with proper permissions
    Given a property listing detail exists
    When I set the bathrooms with proper permissions
    Then the bathrooms should be updated

  Scenario: Setting bathrooms without proper permissions
    Given a property listing detail exists
    When I try to set the bathrooms without proper permissions
    Then a permission error should be thrown

  Scenario: Setting squareFeet with proper permissions
    Given a property listing detail exists
    When I set the squareFeet with proper permissions
    Then the squareFeet should be updated

  Scenario: Setting squareFeet without proper permissions
    Given a property listing detail exists
    When I try to set the squareFeet without proper permissions
    Then a permission error should be thrown

  Scenario: Setting yearBuilt with proper permissions
    Given a property listing detail exists
    When I set the yearBuilt with proper permissions
    Then the yearBuilt should be updated

  Scenario: Setting yearBuilt without proper permissions
    Given a property listing detail exists
    When I try to set the yearBuilt without proper permissions
    Then a permission error should be thrown

  Scenario: Setting lotSize with proper permissions
    Given a property listing detail exists
    When I set the lotSize with proper permissions
    Then the lotSize should be updated

  Scenario: Setting lotSize without proper permissions
    Given a property listing detail exists
    When I try to set the lotSize without proper permissions
    Then a permission error should be thrown

  Scenario: Setting description with proper permissions
    Given a property listing detail exists
    When I set the description with proper permissions
    Then the description should be updated

  Scenario: Setting description without proper permissions
    Given a property listing detail exists
    When I try to set the description without proper permissions
    Then a permission error should be thrown

  Scenario: Setting amenities with proper permissions
    Given a property listing detail exists
    When I set the amenities with proper permissions
    Then the amenities should be updated

  Scenario: Setting amenities without proper permissions
    Given a property listing detail exists
    When I try to set the amenities without proper permissions
    Then a permission error should be thrown

  Scenario: Setting images with proper permissions
    Given a property listing detail exists
    When I set the images with proper permissions
    Then the images should be updated

  Scenario: Setting images without proper permissions
    Given a property listing detail exists
    When I try to set the images without proper permissions
    Then a permission error should be thrown

  Scenario: Setting video with proper permissions
    Given a property listing detail exists
    When I set the video with proper permissions
    Then the video should be updated

  Scenario: Setting video without proper permissions
    Given a property listing detail exists
    When I try to set the video without proper permissions
    Then a permission error should be thrown

  Scenario: Setting floorPlan with proper permissions
    Given a property listing detail exists
    When I set the floorPlan with proper permissions
    Then the floorPlan should be updated

  Scenario: Setting floorPlan without proper permissions
    Given a property listing detail exists
    When I try to set the floorPlan without proper permissions
    Then a permission error should be thrown

  Scenario: Setting floorPlanImages with proper permissions
    Given a property listing detail exists
    When I set the floorPlanImages with proper permissions
    Then the floorPlanImages should be updated

  Scenario: Setting floorPlanImages without proper permissions
    Given a property listing detail exists
    When I try to set the floorPlanImages without proper permissions
    Then a permission error should be thrown

  Scenario: Setting listingAgent with proper permissions
    Given a property listing detail exists
    When I set the listingAgent with proper permissions
    Then the listingAgent should be updated

  Scenario: Setting listingAgent without proper permissions
    Given a property listing detail exists
    When I try to set the listingAgent without proper permissions
    Then a permission error should be thrown

  Scenario: Setting listingAgentPhone with proper permissions
    Given a property listing detail exists
    When I set the listingAgentPhone with proper permissions
    Then the listingAgentPhone should be updated

  Scenario: Setting listingAgentPhone without proper permissions
    Given a property listing detail exists
    When I try to set the listingAgentPhone without proper permissions
    Then a permission error should be thrown

  Scenario: Setting listingAgentEmail with proper permissions
    Given a property listing detail exists
    When I set the listingAgentEmail with proper permissions
    Then the listingAgentEmail should be updated

  Scenario: Setting listingAgentEmail without proper permissions
    Given a property listing detail exists
    When I try to set the listingAgentEmail without proper permissions
    Then a permission error should be thrown

  Scenario: Setting listingAgentWebsite with proper permissions
    Given a property listing detail exists
    When I set the listingAgentWebsite with proper permissions
    Then the listingAgentWebsite should be updated

  Scenario: Setting listingAgentWebsite without proper permissions
    Given a property listing detail exists
    When I try to set the listingAgentWebsite without proper permissions
    Then a permission error should be thrown

  Scenario: Setting listingAgentCompany with proper permissions
    Given a property listing detail exists
    When I set the listingAgentCompany with proper permissions
    Then the listingAgentCompany should be updated

  Scenario: Setting listingAgentCompany without proper permissions
    Given a property listing detail exists
    When I try to set the listingAgentCompany without proper permissions
    Then a permission error should be thrown

  Scenario: Setting listingAgentCompanyPhone with proper permissions
    Given a property listing detail exists
    When I set the listingAgentCompanyPhone with proper permissions
    Then the listingAgentCompanyPhone should be updated

  Scenario: Setting listingAgentCompanyPhone without proper permissions
    Given a property listing detail exists
    When I try to set the listingAgentCompanyPhone without proper permissions
    Then a permission error should be thrown

  Scenario: Setting listingAgentCompanyEmail with proper permissions
    Given a property listing detail exists
    When I set the listingAgentCompanyEmail with proper permissions
    Then the listingAgentCompanyEmail should be updated

  Scenario: Setting listingAgentCompanyEmail without proper permissions
    Given a property listing detail exists
    When I try to set the listingAgentCompanyEmail without proper permissions
    Then a permission error should be thrown

  Scenario: Setting listingAgentCompanyWebsite with proper permissions
    Given a property listing detail exists
    When I set the listingAgentCompanyWebsite with proper permissions
    Then the listingAgentCompanyWebsite should be updated

  Scenario: Setting listingAgentCompanyWebsite without proper permissions
    Given a property listing detail exists
    When I try to set the listingAgentCompanyWebsite without proper permissions
    Then a permission error should be thrown

  Scenario: Setting listingAgentCompanyAddress with proper permissions
    Given a property listing detail exists
    When I set the listingAgentCompanyAddress with proper permissions
    Then the listingAgentCompanyAddress should be updated

  Scenario: Setting listingAgentCompanyAddress without proper permissions
    Given a property listing detail exists
    When I try to set the listingAgentCompanyAddress without proper permissions
    Then a permission error should be thrown

  Scenario: Requesting remove bedroom with proper permissions
    Given a property listing detail exists
    When I request to remove a bedroom with proper permissions
    Then the bedroom should be removed

  Scenario: Requesting remove bedroom without proper permissions
    Given a property listing detail exists
    When I try to request remove a bedroom without proper permissions
    Then a permission error should be thrown

  Scenario: Requesting remove additional amenity with proper permissions
    Given a property listing detail exists
    When I request to remove an additional amenity with proper permissions
    Then the additional amenity should be removed

  Scenario: Requesting remove additional amenity without proper permissions
    Given a property listing detail exists
    When I try to request remove an additional amenity without proper permissions
    Then a permission error should be thrown