@member-management @e2e
Feature: Member Management End-to-End Flow
	As a community administrator
	I want to activate and remove members
	So that member lifecycle changes are enforced correctly

	Background:
		Given I am an authorized community administrator for member management
		And a member exists with a pending account

	Scenario: Activate and remove a member
		When I activate the member
		Then the member should be active
		When I remove the member
		Then the member should be marked as removed
