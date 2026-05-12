Feature: Staff app landing

	As an authenticated staff user without assigned permissions
	I want the staff app to deny access
	So that restricted routes remain protected

	Background:
		Given Alice is an authenticated staff user

	Scenario: Staff user can reach the staff entry route
		When Alice opens the staff app landing
		Then Alice should land on the staff entry route

    
