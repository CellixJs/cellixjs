import { Given, Then, When } from '@cucumber/cucumber';
import { actorCalled, notes } from '@serenity-js/core';
import React from 'react';
import { AuthContext, type AuthContextProps } from 'react-oidc-context';
import { Header as CommunityHeader } from '../../../../../../ocom/ui-community-route-root/src/components/header.tsx';
import { Header as StaffHeader } from '../../../../../../ocom/ui-staff-route-root/src/components/header.tsx';
import { mountComponent } from '../../../shared/support/ui/react-render.ts';
import type { CellixUiWorld } from '../../../world.ts';
import type { HeaderUiNotes } from '../abilities/header-types.ts';
import { ClickHeaderSignIn } from '../tasks/click-header-sign-in.ts';

type Site = 'community' | 'staff';

interface HeaderScenarioState {
	actorName: string;
	site: Site;
	identityProviderUnreachable: boolean;
	originalConsoleError?: typeof console.error;
	signinRedirectCalled: boolean;
	errorCalled: boolean;
}

function getState(world: CellixUiWorld): HeaderScenarioState {
	const state = (world as unknown as { __headerState?: HeaderScenarioState }).__headerState;
	if (!state) {
		throw new Error('Header scenario state has not been initialised — did the Given step run?');
	}
	return state;
}

function initState(world: CellixUiWorld, actorName: string, site: Site): HeaderScenarioState {
	const state: HeaderScenarioState = {
		actorName,
		site,
		identityProviderUnreachable: false,
		signinRedirectCalled: false,
		errorCalled: false,
	};
	(world as unknown as { __headerState: HeaderScenarioState }).__headerState = state;
	return state;
}

Given('{word} visits the community site', async function (this: CellixUiWorld, actorName: string) {
	const actor = actorCalled(actorName);
	initState(this, actorName, 'community');
	await actor.attemptsTo(notes<HeaderUiNotes>().set('signinRedirectCalled', false), notes<HeaderUiNotes>().set('consoleErrorCalled', false), notes<HeaderUiNotes>().set('fallbackInvoked', false));
});

Given('{word} visits the staff site', async function (this: CellixUiWorld, actorName: string) {
	const actor = actorCalled(actorName);
	initState(this, actorName, 'staff');
	await actor.attemptsTo(notes<HeaderUiNotes>().set('signinRedirectCalled', false), notes<HeaderUiNotes>().set('consoleErrorCalled', false), notes<HeaderUiNotes>().set('fallbackInvoked', false));
});

Given('the identity provider is unreachable', function (this: CellixUiWorld) {
	const state = getState(this);
	state.identityProviderUnreachable = true;
});

When('{word} chooses to sign in', async function (this: CellixUiWorld, _actorName: string) {
	const state = getState(this);

	const signinRedirect = (): Promise<void> => {
		state.signinRedirectCalled = true;
		if (state.identityProviderUnreachable) {
			return Promise.reject(new Error('Simulated identity provider failure'));
		}
		return Promise.resolve();
	};

	const authValue = { signinRedirect } as unknown as AuthContextProps;
	const HeaderComponent = state.site === 'community' ? CommunityHeader : StaffHeader;
	const wrapped = React.createElement(AuthContext.Provider, { value: authValue }, React.createElement(HeaderComponent));

	state.originalConsoleError = console.error;
	console.error = (..._args: unknown[]) => {
		state.errorCalled = true;
	};

	const rendered = mountComponent(wrapped);
	this.setHeaderContainer(rendered.container);

	try {
		await ClickHeaderSignIn(rendered.container).performAs(actorCalled(state.actorName));
	} finally {
		if (state.originalConsoleError) {
			console.error = state.originalConsoleError;
		}
		const actor = actorCalled(state.actorName);
		await actor.attemptsTo(
			notes<HeaderUiNotes>().set('signinRedirectCalled', state.signinRedirectCalled),
			notes<HeaderUiNotes>().set('consoleErrorCalled', state.errorCalled),
			notes<HeaderUiNotes>().set('fallbackInvoked', state.errorCalled),
		);
	}
});

Then('{word} is taken to the sign-in flow', async function (this: CellixUiWorld, actorName: string) {
	const actor = actorCalled(actorName);
	const called = await actor.answer(notes<HeaderUiNotes>().get('signinRedirectCalled'));
	if (!called) {
		throw new Error(`Expected ${actorName} to be taken to the sign-in flow, but the sign-in handler was not invoked`);
	}
});

Then('{word} can still reach the sign-in page', async function (this: CellixUiWorld, actorName: string) {
	const actor = actorCalled(actorName);
	const fallback = await actor.answer(notes<HeaderUiNotes>().get('fallbackInvoked'));
	if (!fallback) {
		throw new Error(`Expected ${actorName} to reach the sign-in page via the fallback path, but the fallback was not triggered`);
	}
});
