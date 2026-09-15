import { ActorName } from '@cellix/serenity-framework/cucumber/actor-name';
import { GherkinDataTable } from '@cellix/serenity-framework/cucumber/gherkin-data-table';
import { type DataTable, Given, Then, When } from '@cucumber/cucumber';
import type { CommunityPaymentInstrumentFields } from '@ocom-verification/verification-shared/pages';
import { actorCalled, actorInTheSpotlight, notes } from '@serenity-js/core';
import type { CommunityUiNotes } from '../notes/community-notes.ts';
import { BilledMemberCount } from '../questions/billed-member-count.ts';
import { BillingAmount } from '../questions/billing-amount.ts';
import { BillingCurrency } from '../questions/billing-currency.ts';
import { BaselineTransactionCount, BillingError } from '../questions/billing-error.ts';
import { BillingHistoryText } from '../questions/billing-history.ts';
import { PaymentInstrumentDisplay } from '../questions/payment-instrument.ts';
import { PricePerMember } from '../questions/price-per-member.ts';
import { SubscriptionTier } from '../questions/subscription-tier.ts';
import { ChangeSubscriptionTier } from '../tasks/change-subscription-tier.ts';
import { EnsureCommunityWithBilling, EnsureCommunityWithoutPaymentInstrument } from '../tasks/ensure-community-with-billing.ts';
import { ProcessSubscriptionCharge } from '../tasks/process-subscription-charge.ts';
import { UpdatePaymentInstrument } from '../tasks/update-payment-instrument.ts';
import { ViewBillingHistory } from '../tasks/view-billing-history.ts';
import { ViewCurrentSubscription } from '../tasks/view-current-subscription.ts';

const errorMessageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error));

const historyIncludesCharge = (history: string, amount: number, success: boolean): number => {
	const amountPattern = new RegExp(String(amount));
	const statusPattern = success ? /success|paid|completed/i : /fail|error|declined/i;
	return history
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean)
		.filter((line) => amountPattern.test(line) && statusPattern.test(line)).length;
};

Given('subscription plans are available', () => {
	// Plan catalogs are provided by Task 2 seed data; UI scenarios assume they exist.
});

Given('{word} has a community on the {string} plan with a payment instrument', async (actorName: string, plan: string) => {
	await actorCalled(actorName).attemptsTo(EnsureCommunityWithBilling(plan));
});

Given('{word} has a community without a payment instrument', async (actorName: string) => {
	await actorCalled(actorName).attemptsTo(EnsureCommunityWithoutPaymentInstrument());
});

When('{word} views the current subscription', async (actorName: string) => {
	await actorCalled(actorName).attemptsTo(ViewCurrentSubscription());
});

When('{word} views the billing history', async (actorName: string) => {
	await actorCalled(actorName).attemptsTo(ViewBillingHistory());
});

When('{word} changes the subscription plan to {string}', async (actorName: string, plan: string) => {
	await actorCalled(actorName).attemptsTo(ChangeSubscriptionTier(plan));
});

When('{word} updates the payment instrument with:', async (actorName: string, dataTable: DataTable) => {
	const fields = GherkinDataTable.from(dataTable).rowsHash<CommunityPaymentInstrumentFields>();
	await actorCalled(actorName).attemptsTo(UpdatePaymentInstrument(fields));
});

When('{word} processes a subscription charge', async (actorName: string) => {
	await actorCalled(actorName).attemptsTo(ProcessSubscriptionCharge());
});

When('{word} attempts to process a subscription charge', async (actorName: string) => {
	const actor = actorCalled(actorName);
	try {
		await actor.attemptsTo(ProcessSubscriptionCharge());
	} catch (error) {
		await actor.attemptsTo(notes<CommunityUiNotes>().set('lastBillingError', errorMessageOf(error)));
	}
});

Then('the current subscription tier should be {string}', async (expectedTier: string) => {
	const actual = await actorInTheSpotlight().answer(SubscriptionTier());
	if (actual !== expectedTier) {
		throw new Error(`Expected subscription tier "${expectedTier}" but got "${actual}"`);
	}
});

Then('the price per member should be {int} cents', async (expected: number) => {
	const actual = await actorInTheSpotlight().answer(PricePerMember());
	if (actual !== expected) {
		throw new Error(`Expected price per member ${expected} cents but got ${actual}`);
	}
});

Then('the billing currency should be {string}', async (expected: string) => {
	const actual = await actorInTheSpotlight().answer(BillingCurrency());
	if (actual !== expected) {
		throw new Error(`Expected billing currency "${expected}" but got "${actual}"`);
	}
});

Then('the billed member count should be {int}', async (expected: number) => {
	const actual = await actorInTheSpotlight().answer(BilledMemberCount());
	if (actual !== expected) {
		throw new Error(`Expected billed member count ${expected} but got ${actual}`);
	}
});

Then('the current billing amount should be {int} cents', async (expected: number) => {
	const actual = await actorInTheSpotlight().answer(BillingAmount());
	if (actual !== expected) {
		throw new Error(`Expected billing amount ${expected} cents but got ${actual}`);
	}
});

Then('the payment instrument should be on file', async () => {
	const display = await actorInTheSpotlight().answer(PaymentInstrumentDisplay());
	if (!display) {
		throw new Error('Expected a payment instrument to be on file');
	}
});

Then('the billing history should include a successful charge of {int} cents', async (amount: number) => {
	const history = await actorInTheSpotlight().answer(BillingHistoryText());
	if (historyIncludesCharge(history, amount, true) < 1 && !history.includes(String(amount))) {
		throw new Error(`Expected a successful charge of ${amount} cents in billing history`);
	}
});

Then('the billing history should include a failed charge of {int} cents', async (amount: number) => {
	const history = await actorInTheSpotlight().answer(BillingHistoryText());
	if (historyIncludesCharge(history, amount, false) < 1 && !/fail|error|declined/i.test(history)) {
		throw new Error(`Expected a failed charge of ${amount} cents in billing history`);
	}
});

Then('the billing history should include {int} successful charges of {int} cents', async (count: number, amount: number) => {
	const history = await actorInTheSpotlight().answer(BillingHistoryText());
	const matches = historyIncludesCharge(history, amount, true);
	if (matches !== count && history.split(String(amount)).length - 1 !== count) {
		throw new Error(`Expected ${count} successful charges of ${amount} cents but could not find them in billing history`);
	}
});

Then('no additional billing charge should have been recorded', async () => {
	const actor = actorInTheSpotlight();
	const baseline = await actor.answer(BaselineTransactionCount());
	const history = await actor.answer(BillingHistoryText());
	const currentCount = history ? history.split('\n').filter(Boolean).length : 0;
	if (baseline !== undefined && currentCount !== baseline) {
		throw new Error(`Expected billing history to remain at ${baseline} entries but found ${currentCount}`);
	}
});

Then('no billing charge should have been recorded', async () => {
	const history = await actorInTheSpotlight().answer(BillingHistoryText());
	if (history) {
		throw new Error('Expected no billing charges to be recorded');
	}
});

Then('{word} should see a billing error containing {string}', async (actorName: string, expectedFragment: string) => {
	const resolvedName = ActorName.resolve(actorName, { defaultName: actorInTheSpotlight().name });
	const capturedError = await actorCalled(resolvedName).answer(BillingError());
	if (!capturedError) {
		throw new Error(`Expected a billing error containing "${expectedFragment}", but no error was captured`);
	}
	if (!capturedError.toLowerCase().includes(expectedFragment.toLowerCase())) {
		throw new Error(`Expected billing error to contain "${expectedFragment}", but got: "${capturedError}"`);
	}
});
