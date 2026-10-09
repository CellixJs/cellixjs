Feature: Community settings management

	As a community member with settings permissions
	I want to view and update my community's settings
	So that the community presents the correct name and domains to its members

	Scenario: View the current community settings
		Given Alice is an authenticated admin of the seeded community
		When Alice views the current community
		Then Alice should see the community name "Seeded Community"

	@api-only
	Scenario: View community details by id
		Given Alice is an authenticated admin of the seeded community
		When Alice views the details of the seeded community
		Then Alice should see the community name "Seeded Community"

	Scenario: Rename the community
		Given Alice is an authenticated admin of the seeded community
		When Alice updates the community settings with:
			| name | Renamed Community |
		Then the community settings update should succeed
		And the community name should be "Renamed Community"

	Scenario: Set the community white label domain
		Given Alice is an authenticated admin of the seeded community
		When Alice updates the community settings with:
			| name             | Seeded Community |
			| whiteLabelDomain | seeded-brand     |
		Then the community settings update should succeed
		And the community white label domain should be "seeded-brand"

	Scenario: Set the community custom domain
		Given Alice is an authenticated admin of the seeded community
		When Alice updates the community settings with:
			| name   | Seeded Community             |
			| domain | seeded-community.example.com |
		Then the community settings update should succeed
		And the community domain should be "seeded-community.example.com"

	Scenario: Set the community handle
		Given Alice is an authenticated admin of the seeded community
		When Alice updates the community settings with:
			| name   | Seeded Community |
			| handle | seeded-handle    |
		Then the community settings update should succeed
		And the community handle should be "seeded-handle"

	@validation
	Scenario: Cannot clear the community name
		Given Alice is an authenticated admin of the seeded community
		When Alice attempts to update the community settings with:
			| name | |
		Then Alice should see a community error for "name"
		And the community should not be modified

	@validation @api-only
	Scenario: Community name cannot be updated beyond 200 characters
		Given Alice is an authenticated admin of the seeded community
		When Alice attempts to update the community settings with a name of 201 characters
		Then Alice should see a community error for "name"
		And the community should not be modified

	@skip-ui
	Scenario: Member without settings permission cannot update the community
		Given Bob is an authenticated member of the seeded community without settings permissions
		When Bob attempts to update the community settings with:
			| name | Hijacked Community |
		Then Bob should see a community error containing "do not have permission"
		And the community should not be modified

	@api-only
	Scenario: Admin of another community cannot update the seeded community
		Given Carol is an authenticated admin of the other community
		When Carol attempts to update the community settings with:
			| name | Cross Community Takeover |
		Then Carol should see a community error containing "do not have permission"
		And the community should not be modified

	@api-only
	Scenario: Staff user who can manage all communities can view any community
		Given Alice is a staff user who can manage all communities
		When Alice views the details of the seeded community
		Then Alice should see the community name "Seeded Community"

	@api-only
	Scenario: Staff user who can manage all communities can update any community
		Given Alice is a staff user who can manage all communities
		When Alice updates the community settings with:
			| name | Staff Renamed Community |
		Then the community settings update should succeed
		And the community name should be "Staff Renamed Community"

	@api-only
	Scenario: Staff user without manage-all-communities permission cannot update a community
		Given Alice is a staff user who cannot manage all communities
		When Alice attempts to update the community settings with:
			| name | Staff Takeover |
		Then Alice should see a community error containing "do not have permission"
		And the community should not be modified

	@api-only
	Scenario: Unauthenticated users cannot update community settings
		Given Alice is an unauthenticated guest
		When Alice attempts to update the community settings with:
			| name | Anonymous Takeover |
		Then the community update should be rejected as unauthorized
		And the community should not be modified
