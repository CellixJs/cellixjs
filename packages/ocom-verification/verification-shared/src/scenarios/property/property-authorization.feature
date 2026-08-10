@api-only
Feature: Property management authorization

	As a community
	I want property changes restricted to members whose role allows managing properties
	So that residents and guests cannot alter the property directory

	Background:
		Given Alice is an authenticated property manager of a community
		And Bob is a resident member of the same community without property permissions

	Scenario: Resident member cannot create a property
		When Bob attempts to create a property named "Bob's Cabin"
		Then the property operation should be rejected
		And Alice should not see a property named "Bob's Cabin" in the properties list

	Scenario: Resident member cannot update a property
		Given Alice has created a property named "Shared Hall"
		When Bob attempts to update the property "Shared Hall" with:
			| propertyName | Bob's Hall |
		Then the property operation should be rejected
		And Alice should see a property named "Shared Hall" in the properties list
		And Alice should not see a property named "Bob's Hall" in the properties list

	Scenario: Resident member cannot delete a property
		Given Alice has created a property named "Common Green"
		When Bob attempts to delete the property "Common Green"
		Then the property operation should be rejected
		And Alice should see a property named "Common Green" in the properties list

	Scenario: A property manager cannot update a property of another community
		Given Alice has created a property named "Original Home"
		When Alice becomes the property manager of a different community
		And Alice attempts to update the property "Original Home" with:
			| propertyName | Hijacked Home |
		Then the property operation should be rejected

	Scenario: Guests cannot view the properties list
		Given Guest is not authenticated
		When Guest attempts to view the properties list of Alice's community
		Then the property operation should be rejected as unauthorized

	Scenario: Guests cannot create a property
		Given Guest is not authenticated
		When Guest attempts to create a property named "Guest House"
		Then the property operation should be rejected as unauthorized
		And Alice should not see a property named "Guest House" in the properties list
