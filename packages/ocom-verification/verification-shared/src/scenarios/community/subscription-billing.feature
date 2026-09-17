Feature: Community subscription billing

	As a community owner
	I want to choose a subscription plan and keep a payment instrument on file
	So that the community can be billed for its members each month

	Background:
		Given Alice is an authenticated community owner
		And subscription plans are available

	Scenario: Create a community on the Pro plan with a payment instrument
		When Alice creates a community with:
			| name              | Pro Billing Community |
			| plan              | Pro                   |
			| paymentToken      | tok_visa              |
			| billingName       | Alice Owner           |
			| billingEmail      | owner@test.example    |
			| billingAddress    | 1 Main Street         |
			| billingCity       | Portland              |
			| billingState      | OR                    |
			| billingPostalCode | 97201                 |
			| billingCountry    | US                    |
		Then the community should be created successfully
		And the current subscription tier should be "Pro"
		And the price per member should be 1000 cents
		And the billing currency should be "USD"
		And the billed member count should be 1
		And the current billing amount should be 1000 cents
		And the billing history should include a successful charge of 1000 cents
		And the payment instrument should be on file

	Scenario: Create a community on the Enterprise plan with a payment instrument
		When Alice creates a community with:
			| name              | Enterprise Billing Community |
			| plan              | Enterprise                   |
			| paymentToken      | tok_visa                     |
			| billingName       | Alice Owner                  |
			| billingEmail      | owner@test.example           |
			| billingAddress    | 1 Main Street                |
			| billingCity       | Portland                     |
			| billingState      | OR                           |
			| billingPostalCode | 97201                        |
			| billingCountry    | US                           |
		Then the community should be created successfully
		And the current subscription tier should be "Enterprise"
		And the price per member should be 2000 cents
		And the billing currency should be "USD"
		And the billed member count should be 1
		And the current billing amount should be 2000 cents
		And the billing history should include a successful charge of 2000 cents

	Scenario: Creating a community without an explicit plan uses Pro
		When Alice creates a community with:
			| name              | Default Plan Community |
			| paymentToken      | tok_visa               |
			| billingName       | Alice Owner            |
			| billingEmail      | owner@test.example     |
			| billingAddress    | 1 Main Street          |
			| billingCity       | Portland               |
			| billingState      | OR                     |
			| billingPostalCode | 97201                  |
			| billingCountry    | US                     |
		Then the community should be created successfully
		And the current subscription tier should be "Pro"
		And the price per member should be 1000 cents
		And the current billing amount should be 1000 cents

	Scenario: View the current subscription tier and pricing
		Given Alice has a community on the "Pro" plan with a payment instrument
		When Alice views the current subscription
		Then the current subscription tier should be "Pro"
		And the price per member should be 1000 cents
		And the billing currency should be "USD"
		And the billed member count should be 1
		And the current billing amount should be 1000 cents

	Scenario: Changing the subscription plan updates pricing without charging
		Given Alice has a community on the "Pro" plan with a payment instrument
		When Alice changes the subscription plan to "Enterprise"
		Then the current subscription tier should be "Enterprise"
		And the price per member should be 2000 cents
		And the current billing amount should be 2000 cents
		And no additional billing charge should have been recorded

	Scenario: Configure and update the community payment instrument
		Given Alice has a community on the "Pro" plan with a payment instrument
		When Alice updates the payment instrument with:
			| paymentToken      | tok_mastercard     |
			| billingName       | Alice Owner        |
			| billingEmail      | owner@test.example |
			| billingAddress    | 200 Market Street  |
			| billingCity       | Portland           |
			| billingState      | OR                 |
			| billingPostalCode | 97204              |
			| billingCountry    | US                 |
		Then the payment instrument should be on file

	Scenario: View billing history
		Given Alice has a community on the "Pro" plan with a payment instrument
		When Alice views the billing history
		Then the billing history should include a successful charge of 1000 cents

	Scenario: Process a recurring subscription charge
		Given Alice has a community on the "Pro" plan with a payment instrument
		When Alice processes a subscription charge
		Then the billing history should include 2 successful charges of 1000 cents
		And the current billing amount should be 1000 cents

	@api-only
	Scenario: Latest effective plan configuration is used for pricing
		Given a "Pro" plan configuration effective on "2024-06-01" priced at 1500 cents per member
		And a "Pro" plan configuration effective on "2099-01-01" priced at 1800 cents per member
		When Alice creates a community with:
			| name              | Config Resolution Community |
			| plan              | Pro                         |
			| paymentToken      | tok_visa                    |
			| billingName       | Alice Owner                 |
			| billingEmail      | owner@test.example          |
			| billingAddress    | 1 Main Street               |
			| billingCity       | Portland                    |
			| billingState      | OR                          |
			| billingPostalCode | 97201                       |
			| billingCountry    | US                          |
		Then the current subscription tier should be "Pro"
		And the price per member should be 1500 cents
		And the current billing amount should be 1500 cents
		And the billing history should include a successful charge of 1500 cents

	@api-only
	Scenario: Subscription amount uses the current member count
		Given Alice has a community on the "Pro" plan with a payment instrument
		And the community has 3 members
		When Alice processes a subscription charge
		Then the billed member count should be 3
		And the current billing amount should be 3000 cents
		And the billing history should include a successful charge of 3000 cents

	@api-only
	Scenario: A member without community settings permission cannot update billing
		Given Alice has a community on the "Pro" plan with a payment instrument
		And Bob is an authenticated community member without permission to manage community settings
		When Bob attempts to change the subscription plan to "Enterprise"
		Then he should see a billing error containing "permission"
		When Bob attempts to update the payment instrument with:
			| paymentToken | tok_visa |
		Then he should see a billing error containing "permission"
		When Bob attempts to process a subscription charge
		Then he should see a billing error containing "permission"
		And the current subscription tier should be "Pro"

	@api-only
	Scenario: A member without community settings permission cannot read billing data
		Given Alice has a community on the "Pro" plan with a payment instrument
		And Bob is an authenticated community member without permission to manage community settings
		When Bob attempts to view the current subscription
		Then he should see a billing error containing "permission"
		When Bob reads the community billing fields
		Then the payment instrument should not be readable
		And the billing finance details should not be readable

	Scenario: Charging without a payment instrument is rejected
		Given Alice has a community without a payment instrument
		When Alice attempts to process a subscription charge
		Then she should see a billing error containing "payment instrument"
		And no billing charge should have been recorded

	Scenario: A failed payment token records a failed transaction
		Given Alice has a community on the "Pro" plan with a payment instrument
		When Alice updates the payment instrument with:
			| paymentToken      | tok_charge_failure |
			| billingName       | Alice Owner        |
			| billingEmail      | owner@test.example |
			| billingAddress    | 1 Main Street      |
			| billingCity       | Portland           |
			| billingState      | OR                 |
			| billingPostalCode | 97201              |
			| billingCountry    | US                 |
		And Alice processes a subscription charge
		Then the billing history should include a failed charge of 1000 cents

	@validation
	Scenario: Cannot create a community without a payment token
		When Alice attempts to create a community with:
			| name         | Missing Token Community |
			| plan         | Pro                     |
			| paymentToken |                         |
		Then she should see a community error for "payment instrument"
		And no community should be created
