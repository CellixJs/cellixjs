import { ActorName } from '@cellix/serenity-framework/cucumber/actor-name';
import { GherkinDataTable } from '@cellix/serenity-framework/cucumber/gherkin-data-table';
import { type DataTable, Given, Then, When } from '@cucumber/cucumber';
import { actors, toSubscriptionTier } from '@ocom-verification/verification-shared/test-data';
import { actorCalled, actorInTheSpotlight, notes } from '@serenity-js/core';
import { endUserTokenFor, setActorToken } from '../../../shared/abilities/actor-auth.ts';
import type { PaymentInstrumentInput } from '../../../shared/abilities/update-payment-instrument.ts';
import type { CommunityNotes } from '../notes/community-notes.ts';
import { BilledMemberCount } from '../questions/billed-member-count.ts';
import { BillingAmount } from '../questions/billing-amount.ts';
import { BillingCurrency } from '../questions/billing-currency.ts';
import { BaselineTransactionCount, BillingError } from '../questions/billing-error.ts';
import { BillingHistory } from '../questions/billing-history.ts';
import { PaymentInstrument } from '../questions/payment-instrument.ts';
import { PricePerMember } from '../questions/price-per-member.ts';
import { readCommunityNote } from '../questions/read-community-note.ts';
import { SubscriptionTier } from '../questions/subscription-tier.ts';
import { ChangeSubscriptionTier } from '../tasks/change-subscription-tier.ts';
import { EnsureCommunityWithBilling } from '../tasks/ensure-community-with-billing.ts';
import { EnsureMemberCount } from '../tasks/ensure-member-count.ts';
import { ProcessSubscriptionCharge } from '../tasks/process-subscription-charge.ts';
import { SeedCommunityConfig } from '../tasks/seed-community-config.ts';
import { UpdatePaymentInstrument } from '../tasks/update-payment-instrument.ts';
import { ViewBillingHistory } from '../tasks/view-billing-history.ts';
import { ViewCurrentSubscription } from '../tasks/view-current-subscription.ts';

const errorMessageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error));

const paymentInstrumentFromTable = (dataTable: DataTable): PaymentInstrumentInput => GherkinDataTable.from(dataTable).rowsHash<PaymentInstrumentInput>();

const copyCommunityIdFromSpotlight = async (actorName: string): Promise<void> => {
	const communityId = await readCommunityNote(actorInTheSpotlight(), 'lastCommunityId');
	if (!communityId) {
		return;
	}
	await actorCalled(actorName).attemptsTo(notes<CommunityNotes>().set('lastCommunityId', communityId));
};

const clearBillingError = (actorName: string) =>
	actorCalled(actorName).attemptsTo(notes<CommunityNotes>().set('lastBillingError', undefined as unknown as string), notes<CommunityNotes>().set('lastBillingStatus', undefined as unknown as string));

Given('subscription plans are available', () => {
	// Default Pro/Enterprise CommunityConfig documents are upserted by verification-shared seedDatabase.
});

Given('{word} has a community on the {string} plan with a payment instrument', async (actorName: string, plan: string) => {
	await actorCalled(actorName).attemptsTo(EnsureCommunityWithBilling.onPlan(plan));
});

Given('{word} has a community without a payment instrument', async (actorName: string) => {
	await actorCalled(actorName).attemptsTo(EnsureCommunityWithBilling.withoutPaymentInstrument());
});

Given('a {string} plan configuration effective on {string} priced at {int} cents per member', async (plan: string, effectiveDate: string, pricePerMember: number) => {
	const subscriptionTier = toSubscriptionTier(plan);
	if (!subscriptionTier) {
		throw new Error(`Unknown subscription plan "${plan}"`);
	}
	await actorInTheSpotlight().attemptsTo(SeedCommunityConfig.forPlan(subscriptionTier, effectiveDate, pricePerMember));
});

Given('the community has {int} members', async (count: number) => {
	await actorInTheSpotlight().attemptsTo(EnsureMemberCount.of(count));
});

Given('{word} is an authenticated community member without permission to manage community settings', async (actorName: string) => {
	setActorToken(actorName, endUserTokenFor(actors.CommunityMember.name));
	await copyCommunityIdFromSpotlight(actorName);
	actorCalled(actorName);
});

When('{word} views the current subscription', async (actorName: string) => {
	await actorCalled(actorName).attemptsTo(ViewCurrentSubscription.displayed());
});

When('{word} views the billing history', async (actorName: string) => {
	await actorCalled(actorName).attemptsTo(ViewBillingHistory.displayed());
});

When('{word} changes the subscription plan to {string}', async (actorName: string, plan: string) => {
	await actorCalled(actorName).attemptsTo(ChangeSubscriptionTier.to(plan));
});

When('{word} attempts to change the subscription plan to {string}', async (actorName: string, plan: string) => {
	const actor = actorCalled(actorName);
	await copyCommunityIdFromSpotlight(actorName);
	await clearBillingError(actorName);
	try {
		await actor.attemptsTo(ChangeSubscriptionTier.to(plan));
	} catch (error) {
		await actor.attemptsTo(notes<CommunityNotes>().set('lastBillingError', errorMessageOf(error)));
	}
});

When('{word} updates the payment instrument with:', async (actorName: string, dataTable: DataTable) => {
	await actorCalled(actorName).attemptsTo(UpdatePaymentInstrument.with(paymentInstrumentFromTable(dataTable)));
});

When('{word} attempts to update the payment instrument with:', async (actorName: string, dataTable: DataTable) => {
	const actor = actorCalled(actorName);
	await copyCommunityIdFromSpotlight(actorName);
	await clearBillingError(actorName);
	try {
		await actor.attemptsTo(UpdatePaymentInstrument.with(paymentInstrumentFromTable(dataTable)));
	} catch (error) {
		await actor.attemptsTo(notes<CommunityNotes>().set('lastBillingError', errorMessageOf(error)));
	}
});

When('{word} processes a subscription charge', async (actorName: string) => {
	await actorCalled(actorName).attemptsTo(ProcessSubscriptionCharge.now());
});

When('{word} attempts to process a subscription charge', async (actorName: string) => {
	const actor = actorCalled(actorName);
	await copyCommunityIdFromSpotlight(actorName);
	await clearBillingError(actorName);
	try {
		await actor.attemptsTo(ProcessSubscriptionCharge.now());
	} catch (error) {
		await actor.attemptsTo(notes<CommunityNotes>().set('lastBillingError', errorMessageOf(error)));
	}
});

const communityOwnerActor = async () => {
	const alice = actorCalled('Alice');
	if (await readCommunityNote(alice, 'lastCommunityId')) {
		return alice;
	}
	return actorInTheSpotlight();
};

Then('the current subscription tier should be {string}', async (expectedTier: string) => {
	const actual = await (await communityOwnerActor()).answer(SubscriptionTier.displayed());
	if (actual !== expectedTier) {
		throw new Error(`Expected subscription tier "${expectedTier}" but got "${actual}"`);
	}
});

Then('the price per member should be {int} cents', async (expected: number) => {
	const actual = await (await communityOwnerActor()).answer(PricePerMember.inCents());
	if (actual !== expected) {
		throw new Error(`Expected price per member ${expected} cents but got ${actual}`);
	}
});

Then('the billing currency should be {string}', async (expected: string) => {
	const actual = await (await communityOwnerActor()).answer(BillingCurrency.displayed());
	if (actual !== expected) {
		throw new Error(`Expected billing currency "${expected}" but got "${actual}"`);
	}
});

Then('the billed member count should be {int}', async (expected: number) => {
	const actual = await (await communityOwnerActor()).answer(BilledMemberCount.of());
	if (actual !== expected) {
		throw new Error(`Expected billed member count ${expected} but got ${actual}`);
	}
});

Then('the current billing amount should be {int} cents', async (expected: number) => {
	const actual = await (await communityOwnerActor()).answer(BillingAmount.inCents());
	if (actual !== expected) {
		throw new Error(`Expected billing amount ${expected} cents but got ${actual}`);
	}
});

Then('the payment instrument should be on file', async () => {
	const instrument = await (await communityOwnerActor()).answer(PaymentInstrument.displayed());
	const hasInstrument = Boolean(instrument?.maskedCardNumber || instrument?.brand);
	if (!hasInstrument) {
		throw new Error('Expected a payment instrument to be on file');
	}
});

Then('the billing history should include a successful charge of {int} cents', async (amount: number) => {
	const history = await (await communityOwnerActor()).answer(BillingHistory.displayed());
	const match = history.find((transaction) => transaction.amount === amount && transaction.transactionReference?.isSuccess === true);
	if (!match) {
		throw new Error(`Expected a successful charge of ${amount} cents in billing history`);
	}
});

Then('the billing history should include a failed charge of {int} cents', async (amount: number) => {
	const history = await (await communityOwnerActor()).answer(BillingHistory.displayed());
	const match = history.find((transaction) => transaction.amount === amount && transaction.transactionReference?.isSuccess === false);
	if (!match) {
		throw new Error(`Expected a failed charge of ${amount} cents in billing history`);
	}
});

Then('the billing history should include {int} successful charges of {int} cents', async (count: number, amount: number) => {
	const history = await (await communityOwnerActor()).answer(BillingHistory.displayed());
	const matches = history.filter((transaction) => transaction.amount === amount && transaction.transactionReference?.isSuccess === true);
	if (matches.length !== count) {
		throw new Error(`Expected ${count} successful charges of ${amount} cents but found ${matches.length}`);
	}
});

Then('no additional billing charge should have been recorded', async () => {
	const owner = await communityOwnerActor();
	const baseline = await owner.answer(BaselineTransactionCount.recorded());
	if (baseline === undefined) {
		throw new Error('No baseline billing transaction count was recorded');
	}
	const history = await owner.answer(BillingHistory.displayed());
	if (history.length !== baseline) {
		throw new Error(`Expected billing history to remain at ${baseline} transactions but found ${history.length}`);
	}
});

Then('no billing charge should have been recorded', async () => {
	const history = await (await communityOwnerActor()).answer(BillingHistory.displayed());
	if (history.length > 0) {
		throw new Error(`Expected no billing charges but found ${history.length}`);
	}
});

Then('{word} should see a billing error containing {string}', async (actorName: string, expectedFragment: string) => {
	const resolvedName = ActorName.resolve(actorName, { defaultName: actorInTheSpotlight().name });
	const capturedError = await actorCalled(resolvedName).answer(BillingError.captured());
	if (!capturedError) {
		throw new Error(`Expected a billing error containing "${expectedFragment}", but no error was captured`);
	}
	if (!capturedError.toLowerCase().includes(expectedFragment.toLowerCase())) {
		throw new Error(`Expected billing error to contain "${expectedFragment}", but got: "${capturedError}"`);
	}
});
