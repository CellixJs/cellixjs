Feature: Sign In From Header

	As an unauthenticated visitor
	I want to sign in from the site header
	So that I can access my account

	Scenario: Visitor signs in to the community site
		Given Alex visits the community site
		When Alex chooses to sign in
		Then Alex is taken to the sign-in flow

	Scenario: Visitor signs in to the staff site
		Given Alex visits the staff site
		When Alex chooses to sign in
		Then Alex is taken to the sign-in flow

	Scenario: Community visitor can still reach sign-in when the identity provider is unreachable
		Given Alex visits the community site
		And the identity provider is unreachable
		When Alex chooses to sign in
		Then Alex can still reach the sign-in page

	Scenario: Staff visitor can still reach sign-in when the identity provider is unreachable
		Given Alex visits the staff site
		And the identity provider is unreachable
		When Alex chooses to sign in
		Then Alex can still reach the sign-in page
