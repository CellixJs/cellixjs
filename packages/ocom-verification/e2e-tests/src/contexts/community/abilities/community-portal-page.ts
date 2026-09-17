import type { ElementHandle } from '@cellix/serenity-framework/pages';
import { PlaywrightPageAdapter } from '@cellix/serenity-framework/pages/playwright';
import { BrowseTheWeb } from '@cellix/serenity-framework/serenity/browser';
import { BillingPage } from '@ocom-verification/verification-shared/pages';
import { type Actor, type AnswersQuestions, notes } from '@serenity-js/core';
import type { Page, Response } from 'playwright';
import type { E2EBillingPage } from '../../../shared/page-contracts.ts';
import type { CommunityE2ENotes } from '../notes/community-notes.ts';

/**
 * Reads an element's text without Playwright's auto-waiting, so absent feedback
 * (the common case when no error is expected) resolves immediately instead of
 * blocking for the locator timeout.
 */
export const optionalText = async (element: ElementHandle): Promise<string> => {
	if (!(await element.isVisible())) {
		return '';
	}
	return ((await element.textContent()) ?? '').trim();
};

const billingSettingsPath = (communityId: string, memberId = 'current'): string => `/community/${communityId}/admin/${memberId}/settings/billing`;

/** Query the billing screen refetches after every successful billing mutation. */
const BILLING_SUMMARY_QUERY = 'AdminCommunityBillingContainerCommunitySubscription';

export const communityBrowserPageOf = (actor: AnswersQuestions): Page => BrowseTheWeb.withActor(actor as unknown as Actor).page;

/**
 * Performs a billing action and waits for its GraphQL mutation and the queries it
 * refetches to settle, so assertions read the refreshed summary rather than the
 * values rendered before the round trip.
 *
 * The response is awaited rather than only `networkidle`, because Apollo dispatches
 * the request asynchronously after the click and the network can still look idle at
 * the moment the wait begins.
 */
export const performBillingAction = async (page: Page, operationName: string, action: () => Promise<void>): Promise<void> => {
	const graphqlOperation = (name: string) => (response: Response) => response.url().includes('/api/graphql') && response.request().method() === 'POST' && (response.request().postData()?.includes(name) ?? false);

	const mutation = page
		.waitForResponse(graphqlOperation(operationName), { timeout: 15_000 })
		.then(() => 'mutation' as const)
		.catch(() => 'timeout' as const);
	// The refetch the screen issues once the mutation resolves; awaiting it is what
	// guarantees the refreshed summary has been delivered to the client.
	const refetch = page.waitForResponse(graphqlOperation(BILLING_SUMMARY_QUERY), { timeout: 15_000 }).catch(() => null);
	// The screen can also reject the action client-side (for example when no payment
	// instrument is on file), in which case no mutation is ever sent.
	const rejected = page
		.locator('.ant-message-error')
		.first()
		.waitFor({ state: 'visible', timeout: 15_000 })
		.then(() => 'rejected' as const)
		.catch(() => 'timeout' as const);

	await action();

	if ((await Promise.race([mutation, rejected])) === 'mutation') {
		await refetch;
		await page.waitForLoadState('networkidle');
	}
};

export const billingPageOn = (page: Page): E2EBillingPage => new BillingPage(new PlaywrightPageAdapter(page));

export const openBillingSettings = async (actor: AnswersQuestions): Promise<E2EBillingPage> => {
	const page = communityBrowserPageOf(actor);
	let communityId: string | null = null;
	try {
		communityId = await (actor as unknown as Actor).answer(notes<CommunityE2ENotes>().get('communityId'));
	} catch {
		communityId = null;
	}

	const targetPath = communityId ? billingSettingsPath(communityId) : '/community/admin/settings/billing';
	await page.goto(targetPath, { waitUntil: 'networkidle' });
	return billingPageOn(page);
};
