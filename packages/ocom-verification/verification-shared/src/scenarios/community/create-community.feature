Feature: Create Community

	As a registered user
	I want to create a new community
	So that I can manage members and services within it

	Background:
		Given Alice is an authenticated community owner

	Scenario: Create a community with basic details
		When Alice creates a community with:
			| name | Test Community |
		Then the community should be created successfully
		And the community name should be "Test Community"

	Scenario: Create a community with a descriptive name
		When Alice creates a community with:
			| name | Portland Outdoor Enthusiasts |
		Then the community should be created successfully
		And the community name should be "Portland Outdoor Enthusiasts"

	@validation
	Scenario: Cannot create community without required name
		When Alice attempts to create a community with:
			| name | |
		Then she should see a community error for "name"
		And no community should be created

	@validation
	Scenario: Community name must not be empty whitespace
		When Alice attempts to create a community with:
			| name |   |
		Then she should see a community error for "name"
		And no community should be created
