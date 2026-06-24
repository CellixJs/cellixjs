import { Render } from '@cellix/serenity-framework/dom/render-in-dom';
import { Given, Then, When } from '@cucumber/cucumber';
import { actorCalled, actorInTheSpotlight, notes } from '@serenity-js/core';
import React from 'react';
import { AuthContext, type AuthContextProps } from 'react-oidc-context';
import { SectionLayout as CommunitySectionLayout } from '../../../../../../ocom/ui-community-route-root/src/section-layout.tsx';
import { SectionLayout as StaffSectionLayout } from '../../../../../../ocom/ui-staff-route-root/src/section-layout.tsx';
import { wrapOcomComponent } from '../../../shared/ocom-component-wrapper.ts';
import type { HeaderUiNotes } from '../notes/header-notes.ts';
import { ClickHeaderSignIn } from '../tasks/click-header-sign-in.ts';

type Site = 'community' | 'staff';

async function visitSite(actorName: string, site: Site): Promise<void> {
	await actorCalled(actorName).attemptsTo(
		notes<HeaderUiNotes>().set('site', site),
		notes<HeaderUiNotes>().set('identityProviderUnreachable', false),
		notes<HeaderUiNotes>().set('signinRedirectCalled', false),
		notes<HeaderUiNotes>().set('consoleErrorCalled', false),
		notes<HeaderUiNotes>().set('fallbackInvoked', false),
	);
}

Given('{word} visits the community site', async (actorName: string) => {
	await visitSite(actorName, 'community');
});

Given('{word} visits the staff site', async (actorName: string) => {
	await visitSite(actorName, 'staff');
});

Given('the identity provider is unreachable', async () => {
	await actorInTheSpotlight().attemptsTo(notes<HeaderUiNotes>().set('identityProviderUnreachable', true));
});

When('{word} chooses to sign in', async (actorName: string) => {
	const actor = actorCalled(actorName);
	const site = await actor.answer(notes<HeaderUiNotes>().get('site'));
	const identityProviderUnreachable = await actor.answer(notes<HeaderUiNotes>().get('identityProviderUnreachable'));

	let signinRedirectCalled = false;
	const signinRedirect = (): Promise<void> => {
		signinRedirectCalled = true;
		return identityProviderUnreachable ? Promise.reject(new Error('Simulated identity provider failure')) : Promise.resolve();
	};

	const authValue = { signinRedirect } as unknown as AuthContextProps;
	const PageComponent = site === 'community' ? CommunitySectionLayout : StaffSectionLayout;
	const wrapped = React.createElement(AuthContext.Provider, { value: authValue }, React.createElement(PageComponent));

	const originalConsoleError = console.error;
	let consoleErrorCalled = false;
	console.error = () => {
		consoleErrorCalled = true;
	};

	try {
		await actor.attemptsTo(Render.component(wrapped, { wrapper: wrapOcomComponent() }), ClickHeaderSignIn());
	} finally {
		console.error = originalConsoleError;
		await actor.attemptsTo(
			notes<HeaderUiNotes>().set('signinRedirectCalled', signinRedirectCalled),
			notes<HeaderUiNotes>().set('consoleErrorCalled', consoleErrorCalled),
			notes<HeaderUiNotes>().set('fallbackInvoked', consoleErrorCalled),
		);
	}
});

Then('{word} is taken to the sign-in flow', async (actorName: string) => {
	const called = await actorCalled(actorName).answer(notes<HeaderUiNotes>().get('signinRedirectCalled'));
	if (!called) {
		throw new Error(`Expected ${actorName} to be taken to the sign-in flow, but the sign-in handler was not invoked`);
	}
});

Then('{word} can still reach the sign-in page', async (actorName: string) => {
	const fallback = await actorCalled(actorName).answer(notes<HeaderUiNotes>().get('fallbackInvoked'));
	if (!fallback) {
		throw new Error(`Expected ${actorName} to reach the sign-in page via the fallback path, but the fallback was not triggered`);
	}
});
