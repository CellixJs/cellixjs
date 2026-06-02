import { Given, Then, When } from '@cucumber/cucumber';
import { actorCalled, notes } from '@serenity-js/core';
import type { BrowserContext, Page } from 'playwright';
import * as infra from '../../../shared/shared-infrastructure.ts';
import type { CellixE2EWorld } from '../../../world.ts';
import type { HeaderE2ENotes, HeaderE2ESite } from '../notes/header-notes.ts';
import { ClickHeaderSignIn } from '../tasks/click-header-sign-in.ts';

interface HeaderE2EState {
	actorName: string;
	site: HeaderE2ESite;
	identityProviderUnreachable: boolean;
	context?: BrowserContext;
	page?: Page;
}

type HeaderE2EWorld = CellixE2EWorld & {
	__headerState?: HeaderE2EState;
};

function getHeaderState(world: HeaderE2EWorld): HeaderE2EState {
	if (!world.__headerState) throw new Error('Header scenario state not initialised');
	return world.__headerState;
}

function setHeaderState(world: HeaderE2EWorld, actorName: string, site: HeaderE2ESite): HeaderE2EState {
	const state: HeaderE2EState = { actorName, site, identityProviderUnreachable: false };
	world.__headerState = state;
	return state;
}

/** Dispose the scenario's isolated browser context */
async function cleanupHeaderContext(state: HeaderE2EState): Promise<void> {
	if (state?.page) {
		await state.page.close().catch(() => undefined);
		delete state.page;
	}
	if (state?.context) {
		await state.context.close().catch(() => undefined);
		delete state.context;
	}
}

Given('{word} visits the community site', async function (this: HeaderE2EWorld, actorName: string) {
	setHeaderState(this, actorName, 'community');
	const actor = actorCalled(actorName);
	await actor.attemptsTo(notes<HeaderE2ENotes>().set('signinRedirectInvoked', false), notes<HeaderE2ENotes>().set('fallbackTriggered', false), notes<HeaderE2ENotes>().set('postLoginUrl', ''));
});

Given('{word} visits the staff site', async function (this: HeaderE2EWorld, actorName: string) {
	setHeaderState(this, actorName, 'staff');
	const actor = actorCalled(actorName);
	await actor.attemptsTo(notes<HeaderE2ENotes>().set('signinRedirectInvoked', false), notes<HeaderE2ENotes>().set('fallbackTriggered', false), notes<HeaderE2ENotes>().set('postLoginUrl', ''));
});

Given('the identity provider is unreachable', function (this: HeaderE2EWorld) {
	getHeaderState(this).identityProviderUnreachable = true;
});

When('{word} chooses to sign in', async function (this: HeaderE2EWorld, actorName: string) {
	const s = getHeaderState(this);
	s.actorName = actorName;
	const actor = actorCalled(actorName);

	const { browser } = infra.getState();
	if (!browser) throw new Error('Browser not launched');

	const baseUrl = s.site === 'community' ? (infra.getState().communityBaseUrl ?? 'https://ownercommunity.localhost:1355') : (infra.getState().staffBaseUrl ?? 'https://staff.ownercommunity.localhost:1355');

	// Fresh unauthenticated context — isolated from the pre-auth context
	// used by other test suites. Cleaned up in the Then step after verification.
	const context = await browser.newContext({
		baseURL: baseUrl,
		ignoreHTTPSErrors: true,
	});
	s.context = context;

	if (s.identityProviderUnreachable) {
		await context.route('**/mock-auth.**', (route) => route.abort('connectionrefused'));
	}

	const page = await context.newPage();
	s.page = page;

	await actor.attemptsTo(ClickHeaderSignIn(page, s.site, s.identityProviderUnreachable));
});

Then('{word} is taken to the sign-in flow', async function (this: HeaderE2EWorld, actorName: string) {
	const state = getHeaderState(this);
	const { page } = state;
	if (!page) throw new Error('No page — did the When step run?');

	try {
		// Verify the page actually landed back on the portal (not stuck on mock-auth)
		const currentUrl = new URL(page.url());
		if (currentUrl.hostname.includes('mock-auth')) {
			throw new Error(`Expected ${actorName} to complete the sign-in flow, but the page is still on the IdP: ${page.url()}`);
		}
		if (currentUrl.pathname.includes('auth-redirect')) {
			throw new Error(`Expected ${actorName} to complete the sign-in flow, but the page is stuck on the auth redirect callback: ${page.url()}`);
		}
	} finally {
		await cleanupHeaderContext(state);
	}
});

Then('{word} can still reach the sign-in page', async function (this: HeaderE2EWorld, actorName: string) {
	const state = getHeaderState(this);
	const { page } = state;
	if (!page) throw new Error('No page — did the When step run?');

	try {
		// With the IdP unreachable, the header's fallback should have fired
		// (direct navigation to the redirect URI). The page should NOT be on
		// mock-auth (which was blocked).
		const currentUrl = new URL(page.url());
		if (currentUrl.hostname.includes('mock-auth')) {
			throw new Error(`Expected ${actorName} to reach the sign-in page via fallback, but somehow ended up on mock-auth: ${page.url()}`);
		}
	} finally {
		await cleanupHeaderContext(state);
	}
});
