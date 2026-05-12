import { Given, Then, When } from '@cucumber/cucumber';
import { actors } from '@ocom-verification/verification-shared/test-data';
import { actorCalled, notes } from '@serenity-js/core';
import type { StaffE2ENotes } from '../abilities/staff-types.ts';
import { StaffCurrentPath } from '../questions/staff-current-path.ts';
import { OpenStaffLanding } from '../tasks/open-staff-landing.ts';

let lastActorName = actors.StaffUser.name;

Given('{word} is an authenticated staff user', async (actorName: string) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	await actor.attemptsTo(notes<StaffE2ENotes>().set('currentPath', ''));
});

When('{word} opens the staff app landing', async (actorName: string) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	await actor.attemptsTo(OpenStaffLanding());
});

Then('{word} should land on the staff entry route', async (actorName: string) => {
	const resolvedName = /^(she|he|they)$/i.test(actorName) ? lastActorName : actorName;
	const actor = actorCalled(resolvedName);
	const currentPath = await actor.answer(StaffCurrentPath());

	if (currentPath !== '/staff') {
		throw new Error(`Expected path "/staff", but got "${currentPath}"`);
	}
});
