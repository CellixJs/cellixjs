Feature: Property management

	As a community member whose role allows managing properties
	I want to create, view, update, and remove properties in my community
	So that the community property directory stays accurate

	Background:
		Given Alice is an authenticated property manager of a community

	Scenario: View all properties of the current community
		Given Alice has created a property named "Harborview Unit 101"
		And Alice has created a property named "Harborview Unit 102"
		When Alice views the properties list
		Then the properties list should include "Harborview Unit 101"
		And the properties list should include "Harborview Unit 102"

	Scenario: Create a property with a name
		When Alice creates a property named "Clubhouse Cottage"
		Then the property should be created successfully
		And the properties list should include "Clubhouse Cottage"

	Scenario: View property details
		Given Alice has created a property named "Harborview Unit 205"
		When Alice views the details of the property "Harborview Unit 205"
		Then she should see the property name "Harborview Unit 205"
		And the viewed property should belong to Alice's community

	Scenario: Update a property's details
		Given Alice has created a property named "Harborview Unit 310"
		When Alice updates the property "Harborview Unit 310" with:
			| propertyName | Harborview Unit 310B |
			| propertyType | condo                |
			| bedrooms     | 3                    |
			| bathrooms    | 2.5                  |
			| squareFeet   | 1750                 |
		Then the property should be updated successfully
		And the properties list should include "Harborview Unit 310B"
		And the property "Harborview Unit 310B" should have the property type "condo"
		And the property "Harborview Unit 310B" should have 3 bedrooms, 2.5 bathrooms, and 1750 square feet

	@api-only
	Scenario: Clear a property's numeric listing details
		Given Alice has created a property named "Clearable Cottage"
		And Alice updates the property "Clearable Cottage" with:
			| bedrooms   | 4    |
			| bathrooms  | 2    |
			| squareFeet | 1200 |
		When Alice updates the property "Clearable Cottage" with:
			| bedrooms   |  |
			| bathrooms  |  |
			| squareFeet |  |
		Then the property should be updated successfully
		And the property "Clearable Cottage" should have no bedrooms, bathrooms, or square feet recorded

	@api-only
	Scenario: Clear a property's type
		Given Alice has created a property named "Typeless Cottage"
		And Alice updates the property "Typeless Cottage" with:
			| propertyType | condo |
		When Alice updates the property "Typeless Cottage" with:
			| propertyType |  |
		Then the property should be updated successfully
		And the property "Typeless Cottage" should have no property type recorded

	Scenario: Remove a property from the community
		Given Alice has created a property named "Harborview Unit 404"
		When Alice deletes the property "Harborview Unit 404"
		Then the property should be deleted successfully
		And the properties list should not include "Harborview Unit 404"
		And the property "Harborview Unit 404" should no longer be retrievable

	@api-only
	Scenario: A deleted property can no longer be updated
		Given Alice has created a property named "Retired Bungalow"
		And Alice deletes the property "Retired Bungalow"
		When Alice attempts to update the property "Retired Bungalow" with:
			| propertyName | Retired Bungalow Revived |
		Then the property operation should be rejected
		And the property "Retired Bungalow" should no longer be retrievable

	Scenario: Property manager role grants the manage-properties permission
		Then Alice's member role should allow managing properties

	@validation
	Scenario: Cannot create a property without a name
		When Alice attempts to create a property with:
			| propertyName | |
		Then she should see a property error for "propertyName"
		And no property should be created

	@validation
	Scenario: Property name must not be empty whitespace
		When Alice attempts to create a property with:
			| propertyName |   |
		Then she should see a property error for "propertyName"
		And no property should be created
