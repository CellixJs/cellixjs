Feature: Property form behavior

	As a community member whose role allows managing properties
	I want the property form to guide my input and save reliably
	So that property records stay accurate without surprises

	Background:
		Given Alice is an authenticated property manager of a community

	@ui-only
	Scenario: Clearing tags from the property form persists the cleared value
		Given Alice has created a property named "Tagged Terrace"
		And Alice updates the property "Tagged Terrace" with:
			| tags | orchard, barn |
		When Alice clears the tags of the property "Tagged Terrace" through the form
		Then the property update should send an empty tags list

	@skip-api
	Scenario: Save & Close saves changes and returns to the properties list
		Given Alice has created a property named "Closing Cottage"
		When Alice saves and closes the property "Closing Cottage" after setting "bedrooms" to "3"
		Then the property should be updated successfully
		And Alice should land back on the properties list

	@ui-only
	Scenario: Save & Close with invalid input stays on the details page
		Given Alice has created a property named "Sticky Cottage"
		When Alice attempts to save and close the property "Sticky Cottage" after clearing the property name
		Then she should see an inline error for the "propertyName" field
		And no property update should be sent
		And Alice should remain on the property details page

	@ui-only
	Scenario: Submitting the create form twice creates only one property
		Given the property backend delays create responses
		When Alice submits the property create form twice for a property named "Twice Tapped"
		Then exactly one property create request should be sent

	@ui-only @validation
	Scenario: Invalid listing agent email is rejected inline
		Given Alice has created a property named "Email Estate"
		When Alice attempts to update the property "Email Estate" with:
			| listingAgentEmail | not-an-email |
		Then she should see an inline error for the "listingAgentEmail" field
		And no property update should be sent

	@ui-only @validation
	Scenario: Non-integer lot size is rejected inline
		Given Alice has created a property named "Fraction Farm"
		When Alice attempts to update the property "Fraction Farm" with:
			| lotSize | 0.5 |
		Then she should see an inline error for the "lotSize" field
		And no property update should be sent

	@ui-only @validation
	Scenario: Comma list entries over the maximum length are rejected inline
		Given Alice has created a property named "Tag Overflow Villa"
		When Alice attempts to update the property "Tag Overflow Villa" with a tags entry of 101 characters
		Then she should see an inline error for the "tags" field
		And no property update should be sent

	@ui-only @validation
	Scenario: More than 50 tags are rejected inline
		Given Alice has created a property named "Tag Flood Villa"
		When Alice attempts to update the property "Tag Flood Villa" with 51 tags
		Then she should see an inline error for the "tags" field
		And no property update should be sent

	@skip-api
	Scenario: Country and state are selected from dropdowns
		Given Alice has created a property named "Dropdown Domicile"
		When Alice selects the state "New York" and country "United States" of the property "Dropdown Domicile" from dropdowns
		Then the property should be updated successfully
		And the property "Dropdown Domicile" should have the address:
			| countrySubdivision | NY            |
			| country            | United States |

	@ui-only
	Scenario: Switching country clears the state selection
		Given Alice has created a property named "Cascade Cottage"
		And Alice selects the state "New York" and country "United States" of the property "Cascade Cottage" from dropdowns
		When Alice switches the country of the property "Cascade Cottage" to "Canada" without saving
		Then the state field of the property form should have no selection
		And the state field of the property form should offer the option "Ontario"
		When Alice switches the country of the property "Cascade Cottage" to "Japan" without saving
		Then the state field of the property form should be a text input

	@ui-only
	Scenario: Number fields present units and appropriate controls
		Given Alice has created a property named "Presentation Palace"
		When Alice views the details of the property "Presentation Palace"
		Then the property form should present the number fields:
			| field      | adornment | placement | controls |
			| price      | $         | prefix    | none     |
			| rentHigh   | $         | prefix    | none     |
			| rentLow    | $         | prefix    | none     |
			| lease      | months    | suffix    | none     |
			| lotSize    | sq ft     | suffix    | none     |
			| squareFeet |           | none      | none     |
			| yearBuilt  |           | none      | none     |
			| maxGuests  |           | none      | spinner  |
			| bedrooms   |           | none      | spinner  |
			| bathrooms  |           | none      | spinner  |
