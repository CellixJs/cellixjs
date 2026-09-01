@member-property
Feature: Member Property management

	As an accepted community member allowed to edit my own properties
	I want to find community properties and manage only my own listing content
	So that the directory is useful without giving me manager powers

	Background:
		Given Maya is an accepted own-property member in a member Property community

	Scenario: An own-property member can enter the current community directory
		Given a foreign same-community member owns the member Property "Neighbor Cottage"
		When Maya opens the member Property directory
		Then the member Property directory includes "Neighbor Cottage"

	@api-only
	Scenario: An own-property member can retrieve a foreign same-community property
		Given a foreign same-community member owns the member Property "Neighbor Cottage"
		When Maya reads the member Property "Neighbor Cottage" from Maya's community
		Then the member Property details are available

	Scenario: An own-property member creates a property through the member route
		When Maya creates a member Property named "Maya Cottage"
		Then the member Property operation succeeds

	@api-only
	Scenario: The server persists a created member Property with the verified member as owner
		When Maya creates a member Property named "Maya Cottage"
		Then the member Property operation succeeds
		And the member Property "Maya Cottage" is persisted with Maya as its owner

	@skip-api
	Scenario: A foreign same-community property is read-only and hides its owner's identity
		Given a foreign same-community member owns the member Property "Neighbor Cottage"
		When Maya opens the member Property details for "Neighbor Cottage"
		Then the member Property detail is read-only
		And the member Property detail does not display the foreign owner identity

	Scenario: An owner updates an allowed listing-content field
		Given Maya owns the member Property "Maya Listing"
		When Maya sets the member Property "Maya Listing" listing flag "listedInDirectory" to "true"
		Then the member Property operation succeeds
		And the member Property "Maya Listing" has listing flag "listedInDirectory" set to "true"

	@skip-api
	Scenario Outline: Ineligible visitors cannot enter a member Property route
		Given <actor> is a "<visitor>" member Property route visitor in Maya's community
		When <actor> opens their member Property directory
		Then <actor> is denied the member Property route

		Examples:
			| actor  | visitor          |
			| Nora   | no-permission    |
			| Noah   | no-role          |
			| Parker | nonaccepted      |
			| Guest  | guest            |
			| Quinn  | mismatched-route |

	@skip-api
	Scenario: A manager entering a member Property URL is redirected to the admin directory
		Given Morgan is the property manager of Maya's member Property community
		When Morgan opens their member Property directory
		Then Morgan is redirected to the admin Property directory
