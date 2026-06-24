import { Given, Then, When } from '@cucumber/cucumber';
import { actorCalled, notes } from '@serenity-js/core';
import type { HeaderApiNotes } from '../notes/header-notes.ts';
import { ClickHeaderSignIn } from '../tasks/click-header-sign-in.ts';

let lastActorName = 'Alex';

// Header sign-in is a UI-only concern. These step bindings keep the shared
// feature in sync across layers without exercising any API behaviour.

Given('{word} visits the community site', async (actorName: string) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	await actor.attemptsTo(notes<HeaderApiNotes>().set('identityProviderUnreachable', false), notes<HeaderApiNotes>().set('signinRedirectInvoked', false), notes<HeaderApiNotes>().set('fallbackTriggered', false));
});

Given('{word} visits the staff site', async (actorName: string) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	await actor.attemptsTo(notes<HeaderApiNotes>().set('identityProviderUnreachable', false), notes<HeaderApiNotes>().set('signinRedirectInvoked', false), notes<HeaderApiNotes>().set('fallbackTriggered', false));
});

Given('the identity provider is unreachable', async () => {
	const actor = actorCalled(lastActorName);
	await actor.attemptsTo(notes<HeaderApiNotes>().set('identityProviderUnreachable', true));
});

When('{word} chooses to sign in', async (actorName: string) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	await actor.attemptsTo(ClickHeaderSignIn());
});

Then('{word} is taken to the sign-in flow', async (actorName: string) => {
	const actor = actorCalled(actorName);
	const invoked = await actor.answer(notes<HeaderApiNotes>().get('signinRedirectInvoked'));
	if (!invoked) {
		throw new Error(`Expected ${actorName} to be taken to the sign-in flow, but the sign-in handler was not invoked`);
	}
});

Then('{word} can still reach the sign-in page', async (actorName: string) => {
	const actor = actorCalled(actorName);
	const fallback = await actor.answer(notes<HeaderApiNotes>().get('fallbackTriggered'));
	if (!fallback) {
		throw new Error(`Expected ${actorName} to reach the sign-in page via the fallback path, but the fallback was not triggered`);
	}
});
