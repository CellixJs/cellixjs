import { TaskStep } from '@cellix/serenity-framework/serenity';
import { type Activity, type Actor, notes, Task } from '@serenity-js/core';
import type { HeaderApiNotes } from '../notes/header-notes.ts';

export const ClickHeaderSignIn = () =>
	Task.where(
		'#actor chooses to sign in through the authentication API',
		new TaskStep('#actor requests the sign-in redirect state', async (serenityActor) => {
			const actor = serenityActor as Actor;
			const unreachable = await actor.answer(notes<HeaderApiNotes>().get('identityProviderUnreachable'));

			await actor.attemptsTo(notes<HeaderApiNotes>().set('signinRedirectInvoked', !unreachable), notes<HeaderApiNotes>().set('fallbackTriggered', unreachable));
		}) as Activity,
	);
