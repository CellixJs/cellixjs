Feature: Staff workspace access

	As a staff business user
	I want each workspace to follow role-based access rules
	So that sensitive operations are only available to authorized roles

	Scenario: Finance staff user is directed to the finance workspace
		Given Alice is an authenticated "finance" staff user
		When Alice enters the staff operations workspace
		Then Alice should be directed to "/staff/finance"

	Scenario: Tech admin user is directed to the tech admin workspace
		Given Alice is an authenticated "tech admin" staff user
		When Alice enters the staff operations workspace
		Then Alice should be directed to "/staff/tech"

	Scenario: Service line owner is directed to the community management workspace
		Given Alice is an authenticated "service line owner" staff user
		When Alice enters the staff operations workspace
		Then Alice should be directed to "/staff/community-management"

	Scenario: Case manager is directed to the community management workspace
		Given Alice is an authenticated "case manager" staff user
		When Alice enters the staff operations workspace
		Then Alice should be directed to "/staff/community-management"

	Scenario: Finance staff user can work in the finance workspace
		Given Alice is an authenticated "finance" staff user
		When Alice attempts to work in the finance workspace
		Then Alice should be directed to "/staff/finance"

	Scenario: Tech admin user can work in the finance workspace
		Given Alice is an authenticated "tech admin" staff user
		When Alice attempts to work in the finance workspace
		Then Alice should be directed to "/staff/finance"

	Scenario: Service line owner cannot work in the finance workspace
		Given Alice is an authenticated "service line owner" staff user
		When Alice attempts to work in the finance workspace
		Then Alice should be directed to "/unauthorized"

	Scenario: Case manager cannot work in the finance workspace
		Given Alice is an authenticated "case manager" staff user
		When Alice attempts to work in the finance workspace
		Then Alice should be directed to "/unauthorized"
