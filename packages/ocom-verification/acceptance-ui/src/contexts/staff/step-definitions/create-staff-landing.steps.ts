import { Given, Then, When } from '@cucumber/cucumber';
import { actors } from '@ocom-verification/verification-shared/test-data';
import { actorCalled, notes } from '@serenity-js/core';
import type { StaffUiNotes } from '../abilities/staff-types.ts';
import { StaffTargetRoute } from '../questions/staff-target-route.ts';
import { OpenStaffLanding } from '../tasks/open-staff-landing.ts';

let lastActorName = actors.StaffUser.name;

Given('{word} is an authenticated staff user', async (actorName: string) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	await actor.attemptsTo(notes<StaffUiNotes>().set('targetRoute', ''));
});

When('{word} opens the staff app landing', async (actorName: string) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	await actor.attemptsTo(OpenStaffLanding());
});

Then('{word} should land on the staff entry route', async (actorName: string) => {
	const resolvedName = /^(she|he|they)$/i.test(actorName) ? lastActorName : actorName;
	const actor = actorCalled(resolvedName);
	const targetRoute = await actor.answer(StaffTargetRoute());

	if (targetRoute !== '/staff') {
		throw new Error(`Expected route to be "/staff", but got "${targetRoute}"`);
	}
});
