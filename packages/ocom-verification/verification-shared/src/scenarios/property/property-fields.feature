Feature: Property field management

	As a community member whose role allows managing properties
	I want to manage the full set of property fields
	So that the community property directory carries complete listing, location, and ownership information

	Background:
		Given Alice is an authenticated property manager of a community

	Scenario: Properties list shows price, address, and owner
		Given Alice has created a property named "Beacon House"
		And Alice updates the address of the property "Beacon House" with:
			| streetNumber       | 113           |
			| streetName         | Beacon St     |
			| municipality       | Mountain View |
			| countrySubdivision | CA            |
			| postalCode         | 94040         |
			| country            | USA           |
		And Alice updates the listing details of the property "Beacon House" with:
			| price | 425000 |
		And Alice sets the owner of the property "Beacon House" to their own member
		When Alice views the properties list
		Then the properties list should show "$425,000" in the "Price" column of "Beacon House"
		And the properties list should show "113 Beacon St, Mountain View, CA 94040" in the "Address" column of "Beacon House"
		And the properties list should show Alice's member name in the "Owner" column of "Beacon House"

	Scenario: Create a property with the full field set
		When Alice creates a property with the full field set:
			| propertyName               | Grand Pavilion                                                      |
			| propertyType               | house                                                               |
			| listedForSale              | true                                                                |
			| listedInDirectory          | true                                                                |
			| tags                       | waterfront, pool                                                    |
			| streetNumber               | 42                                                                  |
			| streetName                 | Shoreline Dr                                                        |
			| municipality               | Half Moon Bay                                                       |
			| countrySubdivision         | CA                                                                  |
			| postalCode                 | 94019                                                               |
			| country                    | USA                                                                 |
			| price                      | 1250000                                                             |
			| rentHigh                   | 5200                                                                |
			| rentLow                    | 4300                                                                |
			| lease                      | 4800                                                                |
			| maxGuests                  | 8                                                                   |
			| bedrooms                   | 4                                                                   |
			| bathrooms                  | 3.5                                                                 |
			| squareFeet                 | 2800                                                                |
			| yearBuilt                  | 1998                                                                |
			| lotSize                    | 6200                                                                |
			| description                | Ocean view estate with a wraparound deck                            |
			| amenities                  | Pool, Sauna                                                         |
			| images                     | https://cdn.example.com/img1.jpg, https://cdn.example.com/img2.jpg  |
			| video                      | https://cdn.example.com/tour.mp4                                    |
			| floorPlan                  | https://cdn.example.com/plan.pdf                                    |
			| floorPlanImages            | https://cdn.example.com/plan1.png                                   |
			| listingAgent               | Jane Realtor                                                        |
			| listingAgentPhone          | 555-0142                                                            |
			| listingAgentEmail          | jane@realty.example                                                 |
			| listingAgentWebsite        | https://realty.example/jane                                         |
			| listingAgentCompany        | Shoreline Realty                                                    |
			| listingAgentCompanyPhone   | 555-0100                                                            |
			| listingAgentCompanyEmail   | info@realty.example                                                 |
			| listingAgentCompanyWebsite | https://realty.example                                              |
			| listingAgentCompanyAddress | 1 Main St, Half Moon Bay, CA                                        |
		Then the property should be created successfully
		And Alice should land back on the properties list
		And the properties list should include "Grand Pavilion"
		And the property "Grand Pavilion" should record the full field set

	Scenario: Update a property's address
		Given Alice has created a property named "Location Lodge"
		When Alice updates the address of the property "Location Lodge" with:
			| streetNumber       | 500       |
			| streetName         | Main St   |
			| municipality       | Sunnyvale |
			| countrySubdivision | CA        |
			| postalCode         | 94086     |
			| country            | USA       |
		Then the property should be updated successfully
		And the property "Location Lodge" should have the address:
			| streetNumber       | 500       |
			| streetName         | Main St   |
			| municipality       | Sunnyvale |
			| countrySubdivision | CA        |
			| postalCode         | 94086     |
			| country            | USA       |

	Scenario: Assign a property owner
		Given Alice has created a property named "Owned Cottage"
		When Alice sets the owner of the property "Owned Cottage" to their own member
		Then the property should be updated successfully
		And the property "Owned Cottage" should be owned by Alice's member

	@api-only
	Scenario: Clear a property's owner
		Given Alice has created a property named "Disowned Cottage"
		And Alice sets the owner of the property "Disowned Cottage" to their own member
		When Alice clears the owner of the property "Disowned Cottage"
		Then the property should be updated successfully
		And the property "Disowned Cottage" should have no owner recorded

	@api-only
	Scenario: Update a property's listing flags and tags
		Given Alice has created a property named "Flagged Farmhouse"
		When Alice updates the listing flags of the property "Flagged Farmhouse" with:
			| listedForSale     | true  |
			| listedForRent     | true  |
			| listedForLease    | false |
			| listedInDirectory | true  |
		And Alice updates the tags of the property "Flagged Farmhouse" to "orchard, barn"
		Then the property should be updated successfully
		And the property "Flagged Farmhouse" should have the listing flags:
			| listedForSale     | true  |
			| listedForRent     | true  |
			| listedForLease    | false |
			| listedInDirectory | true  |
		And the property "Flagged Farmhouse" should have the tags "orchard, barn"

	Scenario: Update a property's extended listing details
		Given Alice has created a property named "Detail Duplex"
		When Alice updates the listing details of the property "Detail Duplex" with:
			| price       | 725000                        |
			| rentHigh    | 3900                          |
			| rentLow     | 3200                          |
			| lease       | 3600                          |
			| maxGuests   | 6                             |
			| yearBuilt   | 1976                          |
			| lotSize     | 5400                          |
			| description | Bright duplex near the marina |
		Then the property should be updated successfully
		And the property "Detail Duplex" should have the listing details:
			| price       | 725000                        |
			| rentHigh    | 3900                          |
			| rentLow     | 3200                          |
			| lease       | 3600                          |
			| maxGuests   | 6                             |
			| yearBuilt   | 1976                          |
			| lotSize     | 5400                          |
			| description | Bright duplex near the marina |

	Scenario: Update a property's amenities
		Given Alice has created a property named "Amenity Abbey"
		When Alice updates the amenities of the property "Amenity Abbey" to "Pool, Gym, Sauna"
		And Alice adds an additional amenity category "Outdoor" with amenities "Fire Pit, BBQ" to the property "Amenity Abbey"
		Then the property should be updated successfully
		And the property "Amenity Abbey" should have the amenities "Pool, Gym, Sauna"
		And the property "Amenity Abbey" should have an additional amenity category "Outdoor" with amenities "Fire Pit, BBQ"

	Scenario: Record bedroom details for a property
		Given Alice has created a property named "Bedroom Bungalow"
		When Alice adds a bedroom detail with room name "Primary Suite" and bed descriptions "King, Crib" to the property "Bedroom Bungalow"
		Then the property should be updated successfully
		And the property "Bedroom Bungalow" should have a bedroom detail with room name "Primary Suite" and bed descriptions "King, Crib"

	Scenario: Update a property's media links
		Given Alice has created a property named "Media Manor"
		When Alice updates the media of the property "Media Manor" with:
			| images          | https://cdn.example.com/front.jpg, https://cdn.example.com/back.jpg |
			| video           | https://cdn.example.com/tour.mp4                                    |
			| floorPlan       | https://cdn.example.com/plan.pdf                                    |
			| floorPlanImages | https://cdn.example.com/floor1.png                                  |
		Then the property should be updated successfully
		And the property "Media Manor" should have the media links:
			| images          | https://cdn.example.com/front.jpg, https://cdn.example.com/back.jpg |
			| video           | https://cdn.example.com/tour.mp4                                    |
			| floorPlan       | https://cdn.example.com/plan.pdf                                    |
			| floorPlanImages | https://cdn.example.com/floor1.png                                  |

	Scenario: Update a property's listing agent details
		Given Alice has created a property named "Agent Acres"
		When Alice updates the listing agent of the property "Agent Acres" with:
			| listingAgent               | Jane Realtor                 |
			| listingAgentPhone          | 555-0142                     |
			| listingAgentEmail          | jane@realty.example          |
			| listingAgentWebsite        | https://realty.example/jane  |
			| listingAgentCompany        | Shoreline Realty             |
			| listingAgentCompanyPhone   | 555-0100                     |
			| listingAgentCompanyEmail   | info@realty.example          |
			| listingAgentCompanyWebsite | https://realty.example       |
			| listingAgentCompanyAddress | 1 Main St, Half Moon Bay, CA |
		Then the property should be updated successfully
		And the property "Agent Acres" should have the listing agent details:
			| listingAgent               | Jane Realtor                 |
			| listingAgentPhone          | 555-0142                     |
			| listingAgentEmail          | jane@realty.example          |
			| listingAgentWebsite        | https://realty.example/jane  |
			| listingAgentCompany        | Shoreline Realty             |
			| listingAgentCompanyPhone   | 555-0100                     |
			| listingAgentCompanyEmail   | info@realty.example          |
			| listingAgentCompanyWebsite | https://realty.example       |
			| listingAgentCompanyAddress | 1 Main St, Half Moon Bay, CA |

	Scenario: Bathrooms accepts half-step values
		Given Alice has created a property named "Half Bath House"
		When Alice updates the property "Half Bath House" with:
			| bathrooms | 2.5 |
		Then the property should be updated successfully
		And the property "Half Bath House" should have 2.5 bathrooms

	@api-only @validation
	Scenario: Bathrooms not in half steps are rejected
		Given Alice has created a property named "Fraction Flat"
		And Alice updates the property "Fraction Flat" with:
			| bathrooms | 2 |
		When Alice attempts to update the property "Fraction Flat" with:
			| bathrooms | 1.77 |
		Then the property operation should be rejected
		And the property "Fraction Flat" should have 2 bathrooms

	@skip-api @validation
	Scenario: Bathrooms field enforces half-step increments in the form
		Given Alice has created a property named "Fraction Flat"
		When Alice attempts to update the property "Fraction Flat" with:
			| bathrooms | 1.77 |
		Then she should see the bathrooms increment validation message
		And the property "Fraction Flat" should not have been saved

	@skip-api
	Scenario: Property details page shows the Property Details title
		Given Alice has created a property named "Titled Townhome"
		When Alice views the details of the property "Titled Townhome"
		Then the property page title should read "Property Details"
