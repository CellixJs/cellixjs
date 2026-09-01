@member-property @api-only
Feature: Member Property API authorization

	As a community
	I want member Property requests authorized by accepted membership, community, and ownership
	So that members can edit their own listings without gaining directory-manager powers

	Background:
		Given Maya is an accepted own-property member in a member Property community

	Scenario: A foreign same-community update is masked as a missing property
		Given a foreign same-community member owns the member Property "Neighbor Cottage"
		And Morgan is the property manager of Maya's member Property community
		When Maya attempts to set the member Property "Neighbor Cottage" listing flag "listedInDirectory" to "true"
		Then the member Property operation is rejected
		And the member Property error is exactly "Property not found"
		When Maya attempts to update an unknown member Property
		Then the member Property error is exactly "Property not found"
		And Morgan sees the member Property "Neighbor Cottage" listing flag "listedInDirectory" set to "false"

	Scenario: An owner cannot mix a permitted update with a manager-only field
		Given Maya owns the member Property "Maya Listing"
		When Maya attempts to update the member Property "Maya Listing" with:
			| propertyName       | Renamed Listing |
			| listedInDirectory  | true            |
		Then the member Property operation is rejected
		And the member Property "Maya Listing" has listing flag "listedInDirectory" set to "false"
		And no member Property named "Renamed Listing" is created

	Scenario: An owner cannot change type, owner, or delete a property
		Given Maya owns the member Property "Maya Listing"
		When Maya attempts to update the member Property "Maya Listing" with:
			| propertyType | condo |
		Then the member Property operation is rejected
		And the member Property "Maya Listing" has no property type
		And a foreign same-community member is available for member Property ownership
		When Maya attempts to update the member Property "Maya Listing" with:
			| ownerId | foreign |
		Then the member Property operation is rejected
		When Maya attempts to update the member Property "Maya Listing" with:
			| ownerId | clear |
		Then the member Property operation is rejected
		And the member Property "Maya Listing" remains owned by Maya
		When Maya attempts to delete the member Property "Maya Listing"
		Then the member Property operation is rejected
		And the member Property "Maya Listing" remains active
		And the member Property "Maya Listing" remains in Maya's community

	Scenario Outline: A supplied owner id cannot create a member Property
		Given a foreign same-community member is available for member Property ownership
		When Maya attempts to create a member Property named "Spoofed <owner>" with supplied owner id "<owner>"
		Then the member Property operation is rejected
		And no member Property named "Spoofed <owner>" is created

		Examples:
			| owner   |
			| self    |
			| foreign |

	Scenario Outline: An ineligible visitor cannot list, read, create, or update member Properties
		Given a foreign same-community member owns the member Property "Protected Cottage"
		And <actor> is a "<visitor>" member Property API visitor in Maya's community
		When <actor> attempts to list Maya's member Property directory
		Then the member Property operation is rejected
		When <actor> attempts to read the member Property "Protected Cottage" from Maya's community
		Then the member Property details are unavailable
		When <actor> attempts to create a member Property named "<actor> Cabin"
		Then the member Property operation is rejected
		And no member Property named "<actor> Cabin" is created
		When <actor> attempts to set the member Property "Protected Cottage" listing flag "listedInDirectory" to "true"
		Then the member Property operation is rejected

		Examples:
			| actor  | visitor       |
			| Nora   | no-permission |
			| Noah   | no-role       |
			| Parker | created       |
			| Derek  | rejected      |
			| Guest  | guest         |

	Scenario: A member cannot access another community's properties and receives the missing-property result
		Given a foreign same-community member owns the member Property "Protected Cottage"
		And Quinn is an accepted own-property member of a separate member Property community
		When Quinn attempts to list Maya's member Property directory
		Then the member Property operation is rejected
		When Quinn attempts to read the member Property "Protected Cottage" from Maya's community
		Then the member Property details are unavailable
		When Quinn attempts to set the member Property "Protected Cottage" listing flag "listedInDirectory" to "true"
		Then the member Property error is exactly "Property not found"
		When Quinn attempts to update an unknown member Property
		Then the member Property error is exactly "Property not found"

	Scenario: A manager retains all-owner Property management
		Given Maya owns the member Property "Maya Listing"
		And Morgan is the property manager of Maya's member Property community
		When Morgan sets the member Property "Maya Listing" listing flag "listedInDirectory" to "true"
		Then the member Property operation succeeds
		And Morgan sees the member Property "Maya Listing" listing flag "listedInDirectory" set to "true"

	Scenario: A manager-soft-deleted property is hidden and unavailable to a member
		Given Maya owns the member Property "Retired Listing"
		And Morgan is the property manager of Maya's member Property community
		When Morgan deletes the member Property "Retired Listing"
		Then the member Property operation succeeds
		When Maya opens the member Property directory
		Then the member Property directory does not include "Retired Listing"
		When Maya attempts to read the member Property "Retired Listing" from Maya's community
		Then the member Property details are unavailable
		When Maya attempts to set the member Property "Retired Listing" listing flag "listedInDirectory" to "true"
		Then the member Property operation is rejected
